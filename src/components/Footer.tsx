import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-center space-x-6">
          <Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link>
          <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms of Use</Link>
          <a 
            href="https://github.com/yourusername/epic-saga-builder" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900"
          >
            GitHub
          </a>
        </nav>
        <p className="mt-8 text-center text-gray-500">
          © {new Date().getFullYear()} Epic Saga Builder. All rights reserved.
        </p>
      </div>
    </footer>
  );
}