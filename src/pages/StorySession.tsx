import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, LogOut, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import StoryConsole from '../components/StoryConsole';
import StoryMessage from '../components/StoryMessage';
import CharacterList from '../components/CharacterList';
import { isSpeechSupported, speakText, stopSpeech } from '../lib/speech';
import { Story, Character } from '../types';
import { StorySessionManager } from '../lib/session-manager';
import { subscribeToStoryMessages } from '../lib/supabase-realtime';
import { loadStoryWithCharacters, loadStoryMessages, completeStory, sendCharacterMessage, restartStory } from '../lib/story-service';
import { archiveCharacter } from '../lib/character-service';

import type { Message } from '../types';

export default function StorySession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActionEnabled, setIsActionEnabled] = useState(true);
  const sessionManagerRef = useRef<StorySessionManager | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const narrationEnabledRef = useRef(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const autoScrollRef = useRef(true);
  const speechSupportedRef = useRef(isSpeechSupported());

  // Cleanup function
  useEffect(() => {
    return () => {
      console.log('Cleaning up StorySession');
      if (subscriptionRef.current) {
        console.log('Unsubscribing from channel');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      stopSpeech();
    };
  }, []);

  // Update narration ref when state changes
  useEffect(() => {
    narrationEnabledRef.current = isNarrationEnabled;
  }, [isNarrationEnabled]);

  const scrollToBottom = () => {
    if (!autoScrollRef.current || !messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    container.scrollTop = container.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      autoScrollRef.current = isAtBottom;
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to profile');
      navigate('/profile');
      return;
    }
    
    async function initialize() {
      console.log('Initializing StorySession with:', { userId: user.id, storyId: id });
      
      try {
        const loadedStory = await loadStoryWithCharacters(id!, true);
        console.log('Loaded story:', loadedStory);
        setStory(loadedStory);
        
        // Initialize session manager
        const manager = new StorySessionManager(loadedStory);
        await manager.initialize();
        sessionManagerRef.current = manager;
        
        const userCharacter = loadedStory.characters.find(char => char.userId === user.id);
        console.log('Found user character:', userCharacter);
        
        if (userCharacter) {
          setCharacter(userCharacter);
        } else {
          console.error('No character found for user in this story');
          setError('No character found for user in this story');
        }
        
        const loadedMessages = await loadStoryMessages(id!);
        console.log('Loaded messages:', loadedMessages);
        setMessages(loadedMessages);
        
        // Set up real-time subscription
        subscriptionRef.current = subscribeToStoryMessages(
          id!,
          (newMessage) => {
            console.log('Received new message:', newMessage);
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(msg => msg.id === newMessage.id)) {
                console.log('Message already exists:', newMessage.id);
                return prev;
              }
              
              // Handle narration for new messages
              if (narrationEnabledRef.current && newMessage.type === 'narrator') {
                console.log('Speaking new narrator message');
                // Small delay to ensure UI updates first
                setTimeout(() => {
                  speakText(newMessage.content);
                }, 100);
              }
              
              // Sort messages by timestamp
              return [...prev, newMessage].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
          },
          (error) => {
            console.error('Subscription error:', error);
            setError(error.message);
            // Attempt to resubscribe on error
            if (subscriptionRef.current) {
              subscriptionRef.current.subscribe();
            }
          }
        );
      } catch (err) {
        console.error('Error in StorySession initialization:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    }
    
    initialize();
  }, [id, user]);

  async function handleSendMessage(content: string) {
    if (!story || !character) return;
    if (!sessionManagerRef.current) return;

    setIsActionEnabled(false);

    try {
      await sessionManagerRef.current.submitAction(character, content);
      
      // Only re-enable if waiting for this character's next action
      if (sessionManagerRef.current.isWaitingForAction(character.id)) {
        setIsActionEnabled(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setIsActionEnabled(true);
    }
  }

  async function handleCompleteStory() {
    if (!story || !character || !sessionManagerRef.current) return;
    
    setIsActionEnabled(false);

    const confirmMessage = 
      'Are you sure you want to mark this story as completed?\n\n' +
      'This will generate an epic finale and permanently close the story for further actions.';

    if (window.confirm(confirmMessage)) {
      try {
        // Generate and send the finale
        await sessionManagerRef.current.completeStory(character);

        // Mark the story as completed
        await completeStory(story.id);
        
        // Update local story status
        setStory(prevStory => 
          prevStory ? { ...prevStory, status: 'completed' } : null
        );

        // Archive all active characters
        const archivePromises = story.characters
          .filter(char => char.status === 'active')
          .map(char => archiveCharacter(char.id, story.id));
        
        await Promise.all(archivePromises);

        // Redirect to story details page
        navigate(`/stories/${story.id}`);
      } catch (error) {
        setIsActionEnabled(true);
        setError(error instanceof Error ? error.message : 'Failed to complete story');
      }
    } else {
      setIsActionEnabled(true);
    }
  }

  async function handleLeaveStory() {
    if (!character || !story) return;
    
    const confirmMessage = 
      'Are you sure you want to leave this story?\n\n' +
      'WARNING: Leaving will delete your character. If you want to rejoin the story later, ' +
      'you will need to create a new character.';
    
    if (window.confirm(confirmMessage)) {
      setIsLeaving(true);
      try {
        // Send the leaving message
        await sendCharacterMessage(story.id, character.id, 'leaves the party');
        
        // Archive the character and navigate
        await archiveCharacter(character.id, story.id);
        navigate(`/stories/${story.id}`);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to leave story');
        setIsLeaving(false);
      }
    }
  }

  async function handleRestartStory() {
    if (!story) return;
    
    const confirmMessage = 
      'Are you sure you want to restart this story?\n\n' +
      'WARNING: This will delete all story progress except for the initial setup. ' +
      'This action cannot be undone.';
    
    if (window.confirm(confirmMessage)) {
      try {
        await restartStory(story.id);
        // Reload messages after restart
        const loadedMessages = await loadStoryMessages(story.id);
        setMessages(loadedMessages);
        // Re-initialize session manager
        if (sessionManagerRef.current) {
          await sessionManagerRef.current.initialize();
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to restart story');
      }
    }
  }

  // Handle narration toggle
  function handleNarrationToggle() {
    if (!isNarrationEnabled) {
      setIsNarrationEnabled(true);
    } else {
      setIsNarrationEnabled(false);
      stopSpeech();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading story session...</div>
        </main>
      </div>
    );
  }

  if (error || !story || !character) {
    const debugInfo = {
      hasError: !!error,
      errorMessage: error,
      hasStory: !!story,
      hasCharacter: !!character,
    };
    console.log('StorySession error state:', debugInfo);
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-red-600">
            {error || `Unable to load story session. Debug info: ${JSON.stringify(debugInfo)}`}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{story.title}</h1>
                <div className="flex space-x-2">
                  {speechSupportedRef.current && (
                    <button
                      onClick={handleNarrationToggle}
                      className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                        isNarrationEnabled
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isNarrationEnabled ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                      <span>Audio Narration</span>
                    </button>
                  )}
                  <button
                    onClick={handleRestartStory}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Restart Story</span>
                  </button>
                  <button
                    onClick={handleLeaveStory}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Leave Story</span>
                  </button>
                  <button
                    onClick={handleCompleteStory}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Complete Story</span>
                  </button>                  
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg shadow-lg overflow-y-auto flex flex-col-reverse" 
              style={{ height: '60vh' }}
              ref={messagesContainerRef}
            >
              <div className="flex flex-col">
                {messages
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((message) => (
                  <StoryMessage
                    key={message.id}
                    content={message.content}
                    type={message.type}
                    character={message.characterId ? story.characters.find(c => c.id === message.characterId) : undefined}
                    timestamp={message.createdAt}
                  />
                ))}
              </div>
            </div>

            <StoryConsole
              story={story}
              onSendMessage={handleSendMessage}
              character={character}
              onLeaveStory={handleLeaveStory}
              onCompleteStory={handleCompleteStory}
              isEnabled={isActionEnabled && story.status === 'active'}
            />
          </div>

          <div className="lg:col-span-1">
            <CharacterList
              characters={story.characters}
              currentUserId={user.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}