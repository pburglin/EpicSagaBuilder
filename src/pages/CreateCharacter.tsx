import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createCharacter } from '../lib/character-service';
import { loadStoryWithCharacters } from '../lib/story-service';
import { aiOptimize } from '../lib/llm';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Story } from '../types';

export default function CreateCharacter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    race: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/profile');
      return;
    }
    loadStory();
  }, [id, user, navigate]);

  async function handleOptimizeDescription() {
    if (!formData.description.trim()) {
      setError('Please enter a description to optimize');
      return;
    }

    setOptimizing(true);
    setError('');

    try {
      const optimizedDescription = await aiOptimize(formData.description);
      setFormData(prev => ({
        ...prev,
        description: optimizedDescription.slice(0, 1024) // Ensure it's within limit
      }));
    } catch (error) {
      console.error('Error optimizing description:', error);
      setError('Error optimizing description');
    } finally {
      setOptimizing(false);
    }
  }

  async function loadStory() {
    if (!id) return;

    try {
      const storyData = await loadStoryWithCharacters(id);
      setStory(storyData);

      console.log('storyData: ', storyData);
      if (storyData && storyData.characterRaces.length === 1) {
        console.log('TAG');
        setFormData((prevData) => ({
          ...prevData,
          race: storyData.characterRaces[0],
        }));
      }

      if (storyData && storyData.characterClasses.length === 1) {
        console.log('TAG');
        setFormData((prevData) => ({
          ...prevData,
          class: storyData.characterClasses[0],
        }));
      }
  
    } catch (err) {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !story) return;

    setSaving(true);
    setError('');

    try {
      await createCharacter({
        ...formData,
        userId: user.id,
        storyId: story.id
      });
      navigate(`/stories/${id}/session`);
    } catch (err) {
      console.error('Character creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setSaving(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
            <h1 className="text-3xl font-bold mb-6">Create Your Character</h1>
            
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Story Context</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4"><strong>{story.title}</strong></p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{story.description}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Main Quest:</strong> {story.mainQuest}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Starting Scene:</strong> {story.startingScene}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Character Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a class</option>
                  {story.characterClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Race
                </label>
                <select
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a race</option>
                  {story.characterRaces.map((race) => (
                    <option key={race} value={race}>
                      {race}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Character Description
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                    required
                    placeholder="Describe your character's personality, background, and notable traits..."
                  />
                  <button
                    type="button"
                    onClick={handleOptimizeDescription}
                    disabled={optimizing}
                    className="absolute right-2 bottom-2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizing ? 'Optimizing...' : 'AI Optimize'}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Create a memorable character that fits the story's theme and setting.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Character Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://example.com/character-image.jpg"
                />
              </div>

              {error && (
                <p className="text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Creating Character...' : 'Create Character'}
              </button>
            </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}