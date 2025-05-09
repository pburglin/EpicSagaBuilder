import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { sendNarratorMessage } from '../lib/story-service';
import { aiOptimize } from '../lib/llm';
import Header from '../components/Header';
import Footer from '../components/Footer';

const imageStyles = [
  { value: 'anime style', name: 'Anime Style', description: 'Inspired by Japanese animation, this style features expressive characters, vibrant colors, and dramatic shading.' },
  { value: 'Studio Ghibli style', name: 'Ghibliesque Style', description: 'Known for its soft color palettes, lush backgrounds, and whimsical storytelling elements.' },
  { value: 'Disney style', name: 'WalterMouse Animation Style', description: 'Clean lines, exaggerated expressions, and bright, vibrant colors make this style instantly recognizable.' },
  { value: 'realist style', name: 'Real', description: 'Strives to replicate real-world details with accurate lighting, shadows, and proportions.' },
  { value: 'minimalism style', name: 'Minimalism', description: 'Uses clean lines, limited color palettes, and negative space to create sleek and modern visuals.' },
];

export default function CreateStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxAuthors: 5,
    imageUrl: '',
    startingScene: '',
    mainQuest: '',
    characterClasses: '',
    characterRaces: '',
    isPrivate: false,
    storyMechanics: '',
    imageStyle: imageStyles[0].value // Default style
  });

  const [selectedImageStyleDescription, setSelectedImageStyleDescription] = useState(imageStyles[0].description);

  useEffect(() => {
    const defaultStyle = imageStyles.find(style => style.value === formData.imageStyle);
    if (defaultStyle) {
      setSelectedImageStyleDescription(defaultStyle.description);
    }
  }, [formData.imageStyle]);


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
        description: optimizedDescription.slice(0, 1024)
      }));
    } catch (error) {
      console.error('Error optimizing description:', error);
      setError('Error optimizing description');
    } finally {
      setOptimizing(false);
    }
  }

  async function handleOptimizeMainQuest() {
    if (!formData.mainQuest.trim()) {
      setError('Please enter a main quest to optimize');
      return;
    }

    setOptimizing(true);
    setError('');

    try {
      const optimizedContent = await aiOptimize(formData.mainQuest);
      setFormData(prev => ({
        ...prev,
        mainQuest: optimizedContent.slice(0, 1024)
      }));
    } catch (error) {
      console.error('Error optimizing main quest:', error);
      setError('Error optimizing main quest');
    } finally {
      setOptimizing(false);
    }
  }

  async function handleOptimizeStartingScene() {
    if (!formData.startingScene.trim()) {
      setError('Please enter a starting scene to optimize');
      return;
    }

    setOptimizing(true);
    setError('');

    try {
      const optimizedContent = await aiOptimize(formData.startingScene);
      setFormData(prev => ({
        ...prev,
        startingScene: optimizedContent.slice(0, 1024)
      }));
    } catch (error) {
      console.error('Error optimizing starting scene:', error);
      setError('Error optimizing starting scene');
    } finally {
      setOptimizing(false);
    }
  }

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
        character_races: formData.characterRaces.split(',').map(s => s.trim()),
        is_private: formData.isPrivate,
        created_by: user.id,
        story_mechanics: formData.storyMechanics,
        image_style: formData.imageStyle // Add image style to database insert
      })
      .select()
      .single();

    setLoading(false);

    if (storyError || !story) {
      setError('Error creating story');
      return;
    }

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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (name === 'imageStyle') {
      const selectedStyle = imageStyles.find(style => style.value === value);
      if (selectedStyle) {
        setSelectedImageStyleDescription(selectedStyle.description);
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Story</h1>
            <p className="text-red-600">You must sign in before you can create or join stories.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
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
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  required
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Quest
              </label>
              <div className="relative">
                <textarea
                  name="mainQuest"
                  value={formData.mainQuest}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  required
                />
                <button
                  type="button"
                  onClick={handleOptimizeMainQuest}
                  disabled={optimizing}
                  className="absolute right-2 bottom-2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {optimizing ? 'Optimizing...' : 'AI Optimize'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Scene
              </label>
              <div className="relative">
                <textarea
                  name="startingScene"
                  value={formData.startingScene}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  required
                />
                <button
                  type="button"
                  onClick={handleOptimizeStartingScene}
                  disabled={optimizing}
                  className="absolute right-2 bottom-2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {optimizing ? 'Optimizing...' : 'AI Optimize'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story Mechanics (AI Instructions)
              </label>
              <textarea
                name="storyMechanics"
                value={formData.storyMechanics}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Optional instructions for the AI about game mechanics, rules, or special systems"
              />
              <p className="mt-1 text-sm text-gray-500">
                These instructions will be used to instruct the AI but will not be included in the story
              </p>
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
                Story Scene Image Style
              </label>
              <select
                name="imageStyle"
                value={formData.imageStyle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {imageStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.name}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {selectedImageStyleDescription}
              </p>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Private Story - if checked, the story will not be listed to other users
              </label>
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
