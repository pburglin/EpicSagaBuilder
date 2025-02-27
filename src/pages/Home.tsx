import { useState, useEffect } from 'react';
import { Users, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StoryCard from '../components/StoryCard';
import FeatureCard from '../components/FeatureCard';
import { getFeaturedStories } from '../lib/story-service';
import type { Story } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const FEATURED_STORIES_LIMIT = 3;

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function loadFeaturedStories() {
      try {
        const featuredStories = await getFeaturedStories(FEATURED_STORIES_LIMIT);
        setStories(featuredStories);
      } catch (error) {
        console.error('Failed to load featured stories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedStories();
  }, []);

  const handleCreateStoryClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      window.location.href = '/stories/new';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showAuthModal && (
        <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
      )}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-6">
                Build Amazing Sagas with Players and AI
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Join forces with other storytellers and our AI to create epic adventures that will be remembered forever.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCreateStoryClick}
                  className="bg-white text-indigo-600 dark:bg-indigo-600 dark:text-white px-6 py-3 rounded-md font-medium hover:bg-gray-100 dark:hover:bg-indigo-700 transition-colors duration-200"
                >
                  Create New Story
                </button>
                <Link
                  to="/stories"
                  className="bg-white text-indigo-600 dark:bg-indigo-600 dark:text-white px-6 py-3 rounded-md font-medium hover:bg-gray-100 dark:hover:bg-indigo-700 transition-colors duration-200"
                >
                  Join a Story
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Stories */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Featured Stories</h2>
            {loading ? (
              <div className="text-center text-gray-600 dark:text-gray-400">Loading stories...</div>
            ) : stories.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400">
                No stories available. Be the first to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Epic Saga Builder?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Collaborative Storytelling"
                description="Join forces with other players to create unique stories. Each player's actions shape the narrative in real-time."
                Icon={Users}
              />
              <FeatureCard
                title="Rich Character Creation"
                description="Create detailed characters with unique backgrounds, abilities, and personalities that come to life in your adventures."
                Icon={BookOpen}
              />
              <FeatureCard
                title="AI-Powered Narration"
                description="Experience dynamic storytelling powered by advanced AI that adapts to player choices and creates immersive narratives."
                Icon={Sparkles}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}