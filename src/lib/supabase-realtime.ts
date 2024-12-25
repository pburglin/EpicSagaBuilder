import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Message } from '../types';

const REALTIME_CHANGES_TIMEOUT = 50; // Reduced from 100ms to 50ms for faster updates
const MESSAGE_BATCH_SIZE = 3; // Reduced batch size for more frequent updates

export function subscribeToStoryMessages(
  storyId: string,
  onMessage: (message: Message) => void,
  onError: (error: Error) => void
): RealtimeChannel {
  let pendingMessages: Message[] = [];
  let batchTimeoutId: NodeJS.Timeout | null = null;

  function processPendingMessages() {
    if (pendingMessages.length === 0) return;

    // Sort messages by timestamp
    const sortedMessages = [...pendingMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Process messages immediately
    sortedMessages.forEach(msg => {
      console.log('Processing message:', msg.id);
      onMessage(msg);
    });
    
    pendingMessages = [];
  }

  const channel = supabase
    .channel(`story_messages_${storyId}`) // Unique channel per story
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'story_messages',
        filter: `story_id=eq.${storyId}`
      },
      (payload) => {
        try {
          const newMessage = payload.new as Message;
          
          // Validate message
          if (!newMessage.id || !newMessage.content || !newMessage.type) {
            throw new Error('Invalid message format received');
          }
          
          console.log('Received new message:', newMessage.id);
          
          // Add message to pending batch
          pendingMessages.push(newMessage);

          // Clear existing timeout
          if (batchTimeoutId) {
            clearTimeout(batchTimeoutId);
          }

          // Process immediately if batch size reached
          if (pendingMessages.length >= MESSAGE_BATCH_SIZE) {
            console.log('Processing batch immediately');
            processPendingMessages();
          } else {
            // Set short timeout for remaining messages
            batchTimeoutId = setTimeout(() => {
              console.log('Processing batch after timeout');
              processPendingMessages();
            }, REALTIME_CHANGES_TIMEOUT);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          onError(error instanceof Error ? error : new Error('Unknown error processing message'));
        }
      }
    );

  // Subscribe with presence enabled for better reliability
  const subscription = channel
    .subscribe((status) => {
      console.log('Subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to story messages');
      }
      
      if (status === 'CHANNEL_ERROR') {
        console.error('Channel error occurred');
        onError(new Error('Failed to subscribe to story messages'));
      }
    });

  // Add cleanup to the subscription
  const originalUnsubscribe = subscription.unsubscribe;
  subscription.unsubscribe = () => {
    if (batchTimeoutId) {
      clearTimeout(batchTimeoutId);
      processPendingMessages(); // Process any remaining messages
    }
    return originalUnsubscribe.call(subscription);
  };

  return subscription;
}