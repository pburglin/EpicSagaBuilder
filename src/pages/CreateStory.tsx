import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { sendNarratorMessage } from '../lib/story-service';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CreateStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxAuthors: 5,
    imageUrl: '',
    startingScene: '',
    mainQuest: '',
    characterClasses: '',
    characterRaces: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError('');

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: formData.title,
        description: formData.description,
        max_authors: formData.maxAuthors,
        image_url: formData.imageUrl,
        starting_scene: formData.startingScene,
        main_quest: formData.mainQuest,
        character_classes: formData.characterClasses.split(',').map(s => s.trim()),
        character_races: formData.characterRaces.split(',').map(s => s.trim())
      })
      .select()
      .single();

    setLoading(false);

    if (storyError || !story) {
      setError('Error creating story');
      return;
    }

    // Initialize story with introduction messages
    try {
      await sendNarratorMessage(story.id, story.description);
      await sendNarratorMessage(story.id, `Main Quest: ${story.main_quest}`);
      await sendNarratorMessage(story.id, `Starting Scene: ${story.starting_scene}`);
    } catch (error) {
      console.error('Error initializing story messages:', error);
      setError('Error initializing story');
      return;
    }

    navigate('/stories');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Story</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Quest
              </label>
              <textarea
                name="mainQuest"
                value={formData.mainQuest}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Scene
              </label>
              <textarea
                name="startingScene"
                value={formData.startingScene}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Authors
              </label>
              <input
                type="number"
                name="maxAuthors"
                value={formData.maxAuthors}
                onChange={handleInputChange}
                min={1}
                max={10}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Classes
              </label>
              <input
                type="text"
                name="characterClasses"
                value={formData.characterClasses}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Warrior, Mage, Rogue, Cleric"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of available character classes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Races
              </label>
              <input
                type="text"
                name="characterRaces"
                value={formData.characterRaces}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Human, Elf, Dwarf, Halfling"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of available character races
              </p>
            </div>

            {error && (
              <p className="text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}