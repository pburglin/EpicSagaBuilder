import { Character } from '../types';

interface StoryMessageProps {
  content: string;
  type: 'character' | 'narrator';
  character?: Character;
  timestamp: string;
}

export default function StoryMessage({ content, type, character, timestamp }: StoryMessageProps) {
  function formatTimestamp(timestamp: string): string {
    try {
      if (!timestamp) return '';

      // Ensure timestamp is in ISO format
      let date: Date;
      if (timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        // Add time if only date is provided
        date = new Date(timestamp + 'T00:00:00Z');
      }

      if (isNaN(date.getTime())) {
        return ''; // Invalid date
      }

      // Format time
      return new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }

  return (
    <div className={`p-4 ${
      type === 'narrator' 
        ? content.includes('EPIC FINALE') 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
          : 'bg-gray-50 dark:bg-gray-800/50'
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}>
      {type === 'character' ? (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src={character?.imageUrl}
              alt={character?.name}
              className="w-12 h-12 rounded-full border-2 border-indigo-100 dark:border-indigo-900"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300">{character?.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {character?.race} {character?.class} • {formatTimestamp(timestamp)}
              </span>
            </div>
            <p className="text-gray-800 dark:text-gray-200">{content}</p>
          </div>
        </div>
      ) : (
        <div className="pl-16">
          <span className="text-xs text-gray-400 dark:text-gray-500 block mb-1">
            {formatTimestamp(timestamp)}
          </span>
          <p className={`${
            content.includes('EPIC FINALE')
              ? 'text-indigo-800 dark:text-indigo-300 font-medium whitespace-pre-wrap'
              : 'italic text-gray-600 dark:text-gray-400'
          }`}>{content}</p>
        </div>
      )}
    </div>
  );
}