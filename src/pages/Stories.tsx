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
      const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
      const [originalFilter, setOriginalFilter] = useState<'all' | 'original' | 'cloned'>('all');
      const [characterSlotsFilter, setCharacterSlotsFilter] = useState<'open' | 'empty' | 'full'>('open');
      const [myStoriesOnly, setMyStoriesOnly] = useState(false);
      const [sortBy, setSortBy] = useState<'created' | 'updated' | 'karma'>('created');
    
      useEffect(() => {
        loadStories();
      }, [statusFilter, originalFilter, characterSlotsFilter, myStoriesOnly, sortBy, user]);
    
      async function loadStories() {
        if (myStoriesOnly && !user) {
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
    
        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply original/cloned filter
        if (originalFilter === 'original') {
          query = query.is('cloned_from', null);
        } else if (originalFilter === 'cloned') {
          query = query.not('cloned_from', 'is', null);
        }

        // Apply my stories filter
        if (myStoriesOnly && user) {
          const { data: userStories } = await supabase
            .from('characters')
            .select('story_id')
            .eq('user_id', user.id);

          if (userStories) {
            query = query.in('id', userStories.map(story => story.story_id));
          }
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
            .filter((char: { status?: string }) => char.status === 'active')
            .map((char: {
              id: string;
              name: string;
              class: string;
              race: string;
              description: string;
              image_url?: string;
              user_id: string;
              story_id: string;
              karma_points?: number;
              status?: string;
              updated_at?: string;
            }) => ({
              ...char,
              imageUrl: char.image_url || '',
              userId: char.user_id,
              storyId: char.story_id,
              karmaPoints: char.karma_points,
              status: char.status || 'active'
          }))
        }));
    
        // Sort stories
        switch (sortBy) {
          case 'karma':
            processedStories.sort((a, b) => {
              const aKarma = a.characters.reduce((sum: number, char: { karmaPoints?: number }) => sum + (char.karmaPoints || 0), 0);
              const bKarma = b.characters.reduce((sum: number, char: { karmaPoints?: number }) => sum + (char.karmaPoints || 0), 0);
              return bKarma - aKarma;
            });
            break;
          case 'updated':
            processedStories.sort((a, b) => {
              const aLastUpdate = Math.max(
                new Date(a.createdAt).getTime(),
                ...a.characters.map((char: { updated_at?: string }) => new Date(char.updated_at || a.createdAt).getTime())
              );
              const bLastUpdate = Math.max(
                new Date(b.createdAt).getTime(),
                ...b.characters.map((char: { updated_at?: string }) => new Date(char.updated_at || b.createdAt).getTime())
              );
              return bLastUpdate - aLastUpdate;
            });
            break;
          case 'created':
          default:
            processedStories.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            break;
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
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'created' | 'updated' | 'karma')}
                        className="rounded border-gray-300 text-sm"
                      >
                        <option value="created">Created Date</option>
                        <option value="updated">Last Update</option>
                        <option value="karma">Karma</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
                        className="rounded border-gray-300 text-sm"
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Original</label>
                      <select
                        value={originalFilter}
                        onChange={(e) => setOriginalFilter(e.target.value as 'all' | 'original' | 'cloned')}
                        className="rounded border-gray-300 text-sm"
                      >
                        <option value="all">All</option>
                        <option value="original">Original</option>
                        <option value="cloned">Cloned</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Slots</label>
                      <select
                        value={characterSlotsFilter}
                        onChange={(e) => setCharacterSlotsFilter(e.target.value as 'open' | 'empty' | 'full')}
                        className="rounded border-gray-300 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="empty">Empty</option>
                        <option value="full">Full</option>
                      </select>
                    </div>

                    {user && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={myStoriesOnly}
                          onChange={(e) => setMyStoriesOnly(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">My Stories</span>
                      </div>
                    )}
                  </div>
                )}
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
