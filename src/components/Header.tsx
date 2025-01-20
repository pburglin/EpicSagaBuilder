import { ScrollText, LogOut, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import AuthModal from './AuthModal';

export default function Header() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <ScrollText className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Eventfy Epic Saga Builder</span>
          </Link>
          <Link to="/stories" className="text-gray-700 hover:text-gray-900">Stories</Link>
          <Link to="/faq" className="text-gray-700 hover:text-gray-900">FAQ</Link>
          <Link to="/leaderboard" className="text-gray-700 hover:text-gray-900 flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
        </div>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <Link 
                to="/profile" 
                className="flex items-center text-gray-700 hover:text-gray-900"
                title={user.email}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.email}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span>{user.email}</span>
                )}
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}