import { useState, useEffect } from 'react';
import { Trophy, Users, Scroll } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import type { Story, Character } from '../types';

interface UserStats {
  id: string;
  username: string;
  totalKarma: number;
  storiesCount: number;
  characters: Character[];
}

interface StoryStats extends Story {
  totalKarma: number;
}

export default function Leaderboard() {
  const [topStories, setTopStories] = useState<StoryStats[]>([]);
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboards() {
      try {
        // Load top stories
        const { data: stories } = await supabase
          .from('stories')
          .select(`
            *,
            characters (
              id, name, class, race, description, image_url, karma_points,
              user_id, story_id, status
            )
          `)
          .order('current_authors', { ascending: false })
          .limit(10);

          console.log('stories: ', stories);

        if (stories) {
          const storiesWithKarma = stories.map(story => ({
            ...story,
            totalKarma: story.characters.reduce(
              (sum, char) => sum + (char.karmaPoints || 0), 
              0
            ),
            characters: story.characters.map(char => ({
              ...char,
              imageUrl: char.image_url || '',
              userId: char.user_id,
              storyId: char.story_id
            }))
          })).sort((a, b) => b.totalKarma - a.totalKarma);

          console.log('storiesWithKarma: ', storiesWithKarma);

          setTopStories(storiesWithKarma);
        }

        // Load top users
        const { data: users } = await supabase
          .from('users')
          .select(`
            id, username,
            characters (
              id, name, class, race, description, image_url, karma_points,
              user_id, story_id, status
            )
          `)
          .limit(10);

        if (users) {
          const usersWithStats = users.map(user => ({
            id: user.id,
            username: user.username,
            totalKarma: user.characters.reduce(
              (sum, char) => sum + (char.karmaPoints || 0),
              0
            ),
            storiesCount: new Set(user.characters.map(char => char.story_id)).size,
            characters: user.characters.map(char => ({
              ...char,
              imageUrl: char.image_url || '',
              userId: char.user_id,
              storyId: char.story_id
            }))
          })).sort((a, b) => b.totalKarma - a.totalKarma);

          setTopUsers(usersWithStats);
        }
      } catch (error) {
        console.error('Error loading leaderboards:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading leaderboards...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboards
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Stories */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Scroll className="h-6 w-6 text-indigo-500" />
              Top Stories
            </h2>
            <div className="space-y-4">
              {topStories.map((story, index) => (
                <div key={story.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold">{story.title}</h3>
                      <p className="text-sm text-gray-600">
                        {story.characters.length} characters • {story.totalKarma} karma
                      </p>
                      <div className="flex -space-x-2 mt-2">
                        {story.characters.slice(0, 5).map(char => (
                          <img
                            key={char.id}
                            src={char.imageUrl}
                            alt={char.name}
                            title={`${char.name} (${char.karmaPoints} karma)`}
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Top Authors
            </h2>
            <div className="space-y-4">
              {topUsers.map((user, index) => (
                <div key={user.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <div className="flex-grow">
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-gray-600">
                        {user.storiesCount} stories • {user.totalKarma} karma
                      </p>
                      <div className="flex -space-x-2 mt-2">
                        {user.characters.slice(0, 5).map(char => (
                          <img
                            key={char.id}
                            src={char.imageUrl}
                            alt={char.name}
                            title={`${char.name} (${char.karmaPoints} karma)`}
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}