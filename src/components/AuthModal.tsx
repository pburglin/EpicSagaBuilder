import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { signInWithEmail, signUp } from '../lib/auth';
import { supabase } from '../lib/supabase';
const INVITE_CODE_MODE = import.meta.env.VITE_INVITE_CODE_MODE || 'none';
import { useAuth } from '../contexts/AuthContext';
import { validateInviteCode, markInviteCodeUsed } from '../lib/invite-service';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    setNeedsConfirmation(false);

    try {
      if (isSignUp && INVITE_CODE_MODE !== 'none') {
        if (!inviteCode) {
          setError('Invite code is required');
          setIsProcessing(false);
          return;
        }

        const isValidCode = await validateInviteCode(inviteCode);
        if (!isValidCode) {
          setError('Invalid or already used invite code');
          setIsProcessing(false);
          return;
        }
      }

      const { data, error: authError } = isSignUp
        ? await signUp(email, password, inviteCode)
        : await signInWithEmail(email, password);

      if (authError) {
        setError(authError.message);
        setIsProcessing(false);
        return;
      }

      if (isSignUp && data?.user) {
        await markInviteCodeUsed(inviteCode, data.user.id);
      }

      if (data?.session) {
        // Session will trigger useEffect above
      } else if (isSignUp) {
        setNeedsConfirmation(true);
        setError('');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleResendConfirmation() {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      setError('');
      setNeedsConfirmation(true);
    } catch (err) {
      setError('Failed to resend confirmation email. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsConfirmation && (
            <div className="bg-blue-50 p-4 rounded-md text-blue-800">
              <h3 className="font-bold mb-2">Almost there!</h3>
              <p className="text-sm">
                We've sent a confirmation email to <span className="font-medium">{email}</span>.
                Please check your inbox and click the link to verify your account.
              </p>
              <p className="text-sm mt-2">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-blue-800 underline hover:text-blue-900"
                >
                  click here to resend
                </button>.
              </p>
            </div>
          )}

          {error && !needsConfirmation && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {isSignUp && INVITE_CODE_MODE !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required={INVITE_CODE_MODE !== 'none'}
              />
              <label className="block text-sm font-small text-gray-500 mb-1">
                No Invite Code? Contact the admin to request one.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isProcessing 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <p className="text-sm text-center">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
