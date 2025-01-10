import { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { useAuth } from '../contexts/AuthContext';
    import { loadStoryWithCharacters, loadStoryMessages } from '../lib/story-service';
    import { getUserCharacterInStory } from '../lib/character-service';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import StoryMessage from '../components/StoryMessage';
    import type { Story, Message } from '../types';
    import { supabase } from '../lib/supabase';
    
    export default function StoryDetails() {
      const { id } = useParams();
      const navigate = useNavigate();
      const { user } = useAuth();
      const [story, setStory] = useState<Story | null>(null);
      const [messages, setMessages] = useState<Message[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [joiningStory, setJoiningStory] = useState(false);
      const [showNarratorOnly, setShowNarratorOnly] = useState(false);
      const [cloning, setCloning] = useState(false);
    
      useEffect(() => {
        if (!id) return;
        loadStoryData();
      }, [id]);
    
      async function loadStoryData() {
        try {
          const storyData = await loadStoryWithCharacters(id!);
          const storyMessages = await loadStoryMessages(id!);
          console.log('Loaded story data:', storyData);
          setStory(storyData);
          setMessages(storyMessages);
        } catch (err) {
          console.error('Error loading story:', err);
          setError(err instanceof Error ? err.message : 'Failed to load story');
        } finally {
          setLoading(false);
        }
      }
    
      async function handleJoinStory() {
        if (!user || !story) {
          console.log('No user or story:', { user, story });
          return;
        }
        
        console.log('Starting join story process:', {
          userId: user.id,
          storyId: story.id,
          storyTitle: story.title
        });
        
        setJoiningStory(true);
        try {
          console.log('Checking for existing character...');
          const existingCharacter = await getUserCharacterInStory(user.id, story.id);
          console.log('Existing character result:', existingCharacter);
          
          if (existingCharacter) {
            console.log('Character found, navigating to session:', existingCharacter);
            navigate(`/stories/${story.id}/session`);
          } else {
            console.log('No character found, navigating to character creation');
            navigate(`/stories/${story.id}/create-character`);
          }
        } catch (err) {
          console.error('Error in join story process:', err);
          setError('Failed to check character status');
        } finally {
          setJoiningStory(false);
        }
      }
    
      async function handleCloneStory() {
        if (!user || !story) return;
    
        setCloning(true);
        try {
          const { data, error } = await supabase
            .from('stories')
            .insert({
              title: `${story.title} (Cloned)`,
              description: story.description,
              max_authors: story.maxAuthors,
              image_url: story.imageUrl,
              starting_scene: story.startingScene,
              main_quest: story.mainQuest,
              character_classes: story.characterClasses,
              character_races: story.characterRaces,
              cloned_from: story.id
            })
            .select()
            .single();
    
          if (error || !data) {
            console.error('Error cloning story:', error);
            setError('Failed to clone story');
            return;
          }
    
          navigate(`/stories/${data.id}`);
        } catch (err) {
          console.error('Error cloning story:', err);
          setError('Failed to clone story');
        } finally {
          setCloning(false);
        }
      }
    
      if (loading) {
        return (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <div className="text-gray-600">Loading story details...</div>
            </main>
            <Footer />
          </div>
        );
      }
    
      if (error || !story) {
        return (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <div className="text-red-600">{error || 'Story not found'}</div>
            </main>
            <Footer />
          </div>
        );
      }
    
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8"> 
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold dark:text-gray-100">{story.title}</h1>
                    <div className="flex items-center gap-2">
                      {story.cloned_from && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-sm">
                          Cloned
                        </span>
                      )}
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        story.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {story.status}
                      </span>
                    </div>
                  </div>
    
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{story.description}</p>
    
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Main Quest</h2>
                      <p className="text-gray-600 dark:text-gray-400">{story.mainQuest}</p>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Starting Scene</h2>
                      <p className="text-gray-600 dark:text-gray-400">{story.startingScene}</p>
                    </div>
                  </div>
    
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Available Classes</h2>
                      <div className="flex flex-wrap gap-2"> 
                        {(story.characterClasses || []).map((className) => (
                          <span
                            key={className}
                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full text-sm"
                          >
                            {className}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Available Races</h2>
                      <div className="flex flex-wrap gap-2">
                        {(story.characterRaces || []).map((race) => (
                          <span
                            key={race}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                          >
                            {race}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
    
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
                      {story.status === 'completed' ? 'Story Characters' : 'Current Characters'}
                    </h2>
                    {story.characters.filter(char => 
                      story.status === 'completed' ? true : char.status === 'active'
                    ).length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        {story.status === 'completed' 
                          ? 'No characters participated in this story.'
                          : 'No characters yet. Be the first to join!'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {story.characters
                          .filter(char => story.status === 'completed' ? true : char.status === 'active')
                          .map((character) => (
                          <div
                            key={character.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg ${
                              character.status === 'archived'
                                ? 'bg-gray-100 dark:bg-gray-700/50'
                                : 'bg-gray-50 dark:bg-gray-700/30'
                            }`}
                          >
                            <img
                              src={character.imageUrl}
                              alt={character.name}
                              className="w-12 h-12 rounded-full object-cover border dark:border-gray-600"
                            />
                            <div>
                              <h3 className="font-medium dark:text-gray-100">{character.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {character.race} {character.class}
                                {character.status === 'archived' && ' (Archived)'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
    
                  {story.status === 'active' && story.currentAuthors < story.maxAuthors && (
                    <button
                      onClick={handleJoinStory}
                      disabled={joiningStory}
                      className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-3 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:opacity-50"
                    >
                      {joiningStory ? 'Processing...' :
                       !user ? 'Sign In to Join Story' :
                       story.characters.some(char => char.userId === user.id)
                         ? 'Continue Story'
                         : 'Join Story'}
                    </button>
                  )}
                  {user && !story.cloned_from && (
                    <button
                      onClick={handleCloneStory}
                      disabled={cloning}
                      className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 mt-4"
                    >
                      {cloning ? 'Cloning...' : 'Clone Story'}
                    </button>
                  )}
                </div>
                
                {/* Story Messages - Only shown for completed stories */}
                {story.status === 'completed' && (
                  <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold dark:text-gray-100">Story Chronicle</h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            The complete tale of this epic adventure, from beginning to end.
                          </p>
                        </div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showNarratorOnly}
                            onChange={(e) => setShowNarratorOnly(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Show Narrator Only
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="divide-y">
                      {messages
                        .filter(message => !showNarratorOnly || message.type === 'narrator')
                        .map((message) => (
                        <StoryMessage
                          key={message.id}
                          content={message.content}
                          type={message.type}
                          character={message.characterId ? story.characters.find(c => c.id === message.characterId) : undefined}
                          timestamp={message.createdAt}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
