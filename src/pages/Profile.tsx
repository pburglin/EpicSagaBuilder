import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getProfile, createProfile, updateProfile } from '../lib/user-service';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Profile() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showImages, setShowImages] = useState(true);
  const [enableAudioNarration, setEnableAudioNarration] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function loadProfile() {
      try {
        const profile = await getProfile(user!.id);
        
        if (!profile) {
          // Create default profile if none exists
          const defaultUsername = `user_${user!.id.slice(0, 8)}`;
          const newProfile = await createProfile(user!.id, defaultUsername);
          setUsername(newProfile.username);
          setAvatarUrl(newProfile.avatarUrl || '');
        } else {
          setUsername(profile.username);
          setAvatarUrl(profile.avatarUrl || '');
          setShowImages(profile.showImages ?? true);
          setEnableAudioNarration(profile.enableAudioNarration ?? false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      await updateProfile(user!.id, {
        username,
        avatarUrl: avatarUrl || undefined,
        showImages,
        enableAudioNarration,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">User Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_-]+"
              />
              <p className="mt-1 text-sm text-gray-500">
                Only letters, numbers, underscores, and hyphens allowed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Story Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show Images</span>
                  <button
                    onClick={() => setShowImages(!showImages)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      showImages ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showImages ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Enable Audio Narration</span>
                  <button
                    onClick={() => setEnableAudioNarration(!enableAudioNarration)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      enableAudioNarration ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enableAudioNarration ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              </div>
              <div className="border-t pt-6 mt-6">

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Appearance
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}