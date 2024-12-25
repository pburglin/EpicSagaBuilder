import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export default function FeatureCard({ title, description, Icon }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-md bg-indigo-500 text-white mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}