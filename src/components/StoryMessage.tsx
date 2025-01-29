import { useState } from 'react';
import { Character } from '../types';

const DEFAULT_CHARACTER_IMAGE = import.meta.env.VITE_DEFAULT_CHARACTER_IMAGE;
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { voteOnAction } from '../lib/karma-service';

interface StoryMessageProps {
  content: string;
  type: 'character' | 'narrator';
  character?: Character;
  timestamp: string;
  currentCharacter?: Character;
  messageIndex?: number;
  imageUrl?: string;
  areStoryImagesHidden?: boolean;
}

export default function StoryMessage({
  content,
  type,
  character,
  timestamp,
  currentCharacter,
  messageIndex,
  areStoryImagesHidden
}: StoryMessageProps) {
  // Parse content as JSON if it contains both text and imageUrl
  let messageText = content;
  let imageUrl: string | undefined;

  console.log('messageText:', messageText);

  // generate image to describe scene
  const truncatedText = messageText.length > 1000 ? messageText.substring(0, 1000) : messageText;
  imageUrl = `https://image.pollinations.ai/prompt/anime style ${truncatedText}`;
  console.log('imageUrl: ', imageUrl);

  // Check if content looks like JSON
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const parsedContent = JSON.parse(content);
      if (parsedContent.text && typeof parsedContent.text === 'string') {
        messageText = parsedContent.text;
        imageUrl = parsedContent.imageUrl || parsedContent.image_url || parsedContent.image;
        console.log('Parsed message:', { messageText, imageUrl });
      }
    } catch (error) {
      console.error('Error parsing message content:', error);
      // Fall back to using content as-is
      messageText = content;
    }
  } else {
    // Content is plain text
    messageText = content;
  }
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  async function handleVote(isUpvote: boolean) {
    if (!user || !character || !currentCharacter || voting) return;
    
    try {
      setVoting(true);
      await voteOnAction(character.id, currentCharacter.id, isUpvote);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  }

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
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
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
            {character ? (
              <img
                src={character.imageUrl || DEFAULT_CHARACTER_IMAGE}
                alt={character.name}
                className="w-12 h-12 rounded-full border-2 border-indigo-100 dark:border-indigo-900"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">?</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex items-baseline gap-4 mb-1">
              <div className="font-semibold text-indigo-900 dark:text-indigo-300">
                {character?.name || 'Unknown Character'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {character ? `${character.race} ${character.class} • ` : ''}
                {formatTimestamp(timestamp)}
                {character && currentCharacter && character.id !== currentCharacter.id && (
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleVote(true)}
                      disabled={voting || (currentCharacter.karmaPoints || 0) <= 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      title={
                        (currentCharacter.karmaPoints || 0) <= 0 
                          ? "Not enough karma points" 
                          : "Like this action"
                      }
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      disabled={voting || (currentCharacter.karmaPoints || 0) <= 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      title={
                        (currentCharacter.karmaPoints || 0) <= 0 
                          ? "Not enough karma points" 
                          : "Dislike this action"
                      }
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-800 dark:text-gray-200">
              {content}
            </p>
          </div>
        </div>
      ) : (
       <div className="flex items-start gap-4">
         <div className="flex-shrink-0">
           <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
             <span className="text-gray-700 dark:text-gray-300">
               {type === 'narrator' ? messageIndex : ''}
             </span>
           </div>
         </div>
         <div className="flex-grow">
           <span className="text-xs text-gray-400 dark:text-gray-500 block mb-1">
             {formatTimestamp(timestamp)}
           </span>
           <p className={`${
             messageText.includes('EPIC FINALE')
               ? 'text-indigo-800 dark:text-indigo-300 font-medium whitespace-pre-wrap'
               : 'italic text-gray-600 dark:text-gray-400'
           }`}>{messageText}</p>
           {imageUrl && !areStoryImagesHidden && (
             <div className="mt-4">
               <img
                 src={imageUrl}
                 alt="Generated story illustration"
                 className="rounded-lg shadow-md max-w-full h-auto"
                 onError={(e) => {
                   const img = e.target as HTMLImageElement;
                   img.style.display = 'none';
                 }}
               />
             </div>
           )}
         </div>
       </div>
      )}
    </div>
  );
}