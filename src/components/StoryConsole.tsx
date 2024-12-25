import { useState, useEffect } from 'react';
import { Send, Timer, LogOut, CheckCircle } from 'lucide-react';
import { Character } from '../types';
import { getEstimatedProgress } from '../lib/llm-store';

interface StoryConsoleProps {
  story?: { status: string };
  onSendMessage: (content: string) => void;
  character: Character;
  onLeaveStory: () => void;
  onCompleteStory: () => void;
  isEnabled: boolean;
}

const QUICK_ACTIONS = [
  'attack melee',
  'attack ranged',
  'flee',
  'heal self',
  'heal friend',
  'detect traps',
  'rest'
];

export default function StoryConsole({ 
  story,
  onSendMessage, 
  character, 
  onLeaveStory,
  onCompleteStory,
  isEnabled 
}: StoryConsoleProps) {
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [progressStartTime, setProgressStartTime] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isEnabled) {
      setProgressStartTime(null);
      setProgress(0);
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      setTimer(0);
      setProgressStartTime(Date.now());
    }
  }, [isEnabled]);

  // Separate effect for progress updates
  useEffect(() => {
    if (!isEnabled && progressStartTime) {
      const interval = setInterval(() => {
        setProgress(getEstimatedProgress(progressStartTime));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, progressStartTime]);

  function getWaitingMessage(): string {
    if (character.status === 'archived') {
      return 'Character has left the party';
    }
    if (story?.status === 'completed') {
      return 'Story is completed';
    }
    if (progressStartTime) {
      return `Waiting for the AI... ${Math.round(progress)}%`;
    }
    return 'Waiting for the AI...';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !isEnabled) return;
    onSendMessage(message);
    setMessage('');
  }

  function handleQuickAction(action: string) {
    if (!isEnabled) return;
    onSendMessage(action);
    setMessage('');
  }

  function handleLeaveStory() {
    if (window.confirm('Are you sure you want to leave this story?')) {
      onSendMessage('leaves the party');
      onLeaveStory();
    }
  }

  function handleCompleteStory() {
    if (window.confirm('Are you sure you want to mark this story as completed?')) {
      onCompleteStory();
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-2 ${timer >= 60 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
          <Timer className="h-5 w-5" />
          <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
        </div>
        {!isEnabled && (
          <span className="text-sm text-gray-500 italic">
            {getWaitingMessage()}
          </span>
        )}
      </div>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => handleQuickAction(action)}
            disabled={!isEnabled}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Character Action Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`What does ${character.name} do?`}
          disabled={!isEnabled}
          className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!isEnabled}
          className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}