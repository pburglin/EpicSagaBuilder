import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-center space-x-6">
          <Link to="/faq" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">FAQ</Link>
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Terms of Use</Link>
          <a 
            href="https://github.com/pburglin/EpicSagaBuilder"
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            GitHub
          </a>
        </nav>
        <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Epic Saga Builder. All rights reserved.
        </p>
      </div>
    </footer>
  );
}