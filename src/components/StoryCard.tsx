import { Link } from 'react-router-dom';
import { Story } from '../types';

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link to={`/stories/${story.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <img 
          src={story.imageUrl} 
          alt={story.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{story.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              story.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {story.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2">{story.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{story.characters.filter(char => char.status === 'active').length}/{story.maxAuthors} Authors</span>
            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
          {story.characters.length > 0 && (
            <div className="mt-4 flex -space-x-2">
              {story.characters
                .filter(char => char.status === 'active')
                .map((character) => (
                <img
                  key={character.id}
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  title={character.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}