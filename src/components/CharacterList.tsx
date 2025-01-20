import { Character } from '../types';
import { Crown } from 'lucide-react';

const DEFAULT_CHARACTER_IMAGE = import.meta.env.VITE_DEFAULT_CHARACTER_IMAGE;

interface CharacterListProps {
  characters: Character[];
  currentUserId: string;
}

export default function CharacterList({ characters, currentUserId }: CharacterListProps) {
  const maxKarma = Math.max(...characters.map(c => c.karmaPoints || 0));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Active Characters</h2>
      <div className="space-y-4">
        {characters
          .filter(char => char.status === 'active')
          .map((character) => (
          <div
            key={character.id}
            className={`flex items-center gap-3 p-3 rounded-lg dark:border dark:border-gray-700 ${
              character.userId === currentUserId 
                ? 'bg-indigo-50 dark:bg-indigo-900/30'
                : 'bg-gray-50 dark:bg-gray-700/30'
            }`}
          >
            <img
              src={character.imageUrl || DEFAULT_CHARACTER_IMAGE}
              alt={character.name}
              className="w-10 h-10 rounded-full border dark:border-gray-600"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium dark:text-gray-100">{character.name}</h3>
                {character.karmaPoints === maxKarma && maxKarma > 0 && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {character.race} {character.class} • {character.karmaPoints || 0} karma
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}