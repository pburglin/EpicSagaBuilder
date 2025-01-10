import { useState, useEffect } from 'react';
    import { useAuth } from '../contexts/AuthContext';
    import { supabase } from '../lib/supabase';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import StoryCard from '../components/StoryCard';
    import { Story } from '../types';
    
    export default function Stories() {
      const { user, loading: authLoading } = useAuth();
      const [stories, setStories] = useState<Story[]>([]);
      const [loading, setLoading] = useState(true);
      const [showActiveOnly, setShowActiveOnly] = useState(false);
      const [showMyStories, setShowMyStories] = useState(false);
      const [sortByKarma, setSortByKarma] = useState(false);
      const [showCloned, setShowCloned] = useState(false);
    
      useEffect(() => {
        loadStories(sortByKarma);
      }, [showActiveOnly, showMyStories, sortByKarma, showCloned, user]);
    
      async function loadStories(byKarma: boolean) {
        if (showMyStories && !user) {
          setStories([]);
          setLoading(false);
          return;
        }
    
        setLoading(true);
        let query = supabase
          .from('stories')
          .select(`
            *,
            characters(
              id,
              name,
              class,
              race,
              description,
              image_url,
              user_id,
              story_id,
              karma_points,
              status
            )
          `)
          .order('created_at', { ascending: false });
    
        if (showActiveOnly) {
          query = query.eq('status', 'active');
        }
    
        if (showMyStories && user) {
          const { data: userStories } = await supabase
            .from('characters')
            .select('story_id')
            .eq('user_id', user.id);
    
          if (userStories) {
            query = query.in('id', userStories.map(story => story.story_id));
          }
        }
    
        if (!showCloned) {
          query = query.is('cloned_from', null);
        }
    
        const { data, error } = await query;
    
        if (error) {
          console.error('Error loading stories:', error);
          return;
        }
    
        const processedStories = data.map(story => ({
          id: story.id,
          title: story.title,
          description: story.description,
          status: story.status,
          maxAuthors: story.max_authors,
          currentAuthors: story.current_authors,
          createdAt: story.created_at,
          imageUrl: story.image_url || '',
          characterClasses: story.character_classes,
          characterRaces: story.character_races,
          startingScene: story.starting_scene,
          mainQuest: story.main_quest,
          cloned_from: story.cloned_from,
          characters: (story.characters || [])
            .filter(char => char.status === 'active')
            .map(char => ({
              ...char,
              imageUrl: char.image_url || '',
              userId: char.user_id,
              storyId: char.story_id,
              karmaPoints: char.karma_points,
              status: char.status || 'active'
          }))
        }));
    
        // Sort stories
        if (byKarma) {
          processedStories.sort((a, b) => {
            const aKarma = a.characters.reduce((sum, char) => sum + (char.karmaPoints || 0), 0);
            const bKarma = b.characters.reduce((sum, char) => sum + (char.karmaPoints || 0), 0);
            return bKarma - aKarma;
          });
        } else {
          processedStories.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
    
        setStories(processedStories);
        setLoading(false);
      }
    
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Stories</h1>
              <div className="flex gap-4">
                {!authLoading && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Active Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sortByKarma}
                      onChange={(e) => setSortByKarma(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Sort by Karma</span>
                  </label>
                </div>
                )}
                {user && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showMyStories}
                      onChange={(e) => setShowMyStories(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">My Stories</span>
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showCloned}
                    onChange={(e) => setShowCloned(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Cloned</span>
                </label>
              </div>
            </div>
    
            {loading ? (
              <div className="text-center py-8">Loading stories...</div>
            ) : stories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No stories found. Why not create one?
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </main>
          <Footer />
        </div>
      );
    }
