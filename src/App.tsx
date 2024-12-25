import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreateStory from './pages/CreateStory';
import Stories from './pages/Stories';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import StoryDetails from './pages/StoryDetails';
import CreateCharacter from './pages/CreateCharacter';
import StorySession from './pages/StorySession';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stories/new" element={<CreateStory />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:id" element={<StoryDetails />} />
          <Route path="/stories/:id/create-character" element={<CreateCharacter />} />
          <Route path="/stories/:id/session" element={<StorySession />} />
        </Routes>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
