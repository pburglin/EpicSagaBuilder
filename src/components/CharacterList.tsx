import { Character } from '../types';

interface CharacterListProps {
  characters: Character[];
  currentUserId: string;
}

export default function CharacterList({ characters, currentUserId }: CharacterListProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Active Characters</h2>
      <div className="space-y-4">
        {characters
          .filter(char => char.status === 'active')
          .map((character) => (
          <div
            key={character.id}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              character.userId === currentUserId ? 'bg-indigo-50' : 'bg-gray-50'
            }`}
          >
            <img
              src={character.imageUrl}
              alt={character.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">{character.name}</h3>
              <p className="text-sm text-gray-600">
                {character.race} {character.class}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}