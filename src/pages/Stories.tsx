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

  useEffect(() => {
    loadStories();
  }, [showActiveOnly, showMyStories, user]);

  async function loadStories() {
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

    const { data, error } = await query;

    if (error) {
      console.error('Error loading stories:', error);
      return;
    }

    setStories(data.map(story => ({
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
      characters: (story.characters || [])
        .filter(char => char.status === 'active')
        .map(char => ({
          ...char,
          imageUrl: char.image_url || '',
          userId: char.user_id,
          storyId: char.story_id,
          status: char.status || 'active'
        }))
    })));
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-gray-700">Active Stories Only</span>
            </label>
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