import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Message } from '../types';

export function subscribeToStoryMessages(
  storyId: string,
  onMessage: (message: Message) => void,
  onError: (error: Error) => void
): RealtimeChannel {
  console.log('Setting up real-time subscription for story:', storyId);
  
  const channel = supabase.channel('story_messages')
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
          const message = payload.new as Message;
          console.log('Received new message:', {
            id: message.id,
            type: message.type,
            timestamp: new Date().toISOString()
          });

          onMessage(message);
        } catch (error) {
          console.error('Error processing database change:', error);
          onError(error instanceof Error ? error : new Error('Unknown error processing message'));
        }
      }
    );

  // Subscribe with error handling and reconnection logic
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 2000;

  function subscribe() {
    channel.subscribe((status) => {
      console.log('Subscription status:', status);

      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to story messages');
        retryCount = 0;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Channel error occurred');
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying subscription (${retryCount}/${maxRetries})...`);
          
          setTimeout(() => {
            console.log('Attempting to resubscribe...');
            subscribe();
          }, retryDelay * retryCount);
        } else {
          onError(new Error('Failed to maintain connection after multiple attempts'));
        }
      } else if (status === 'TIMED_OUT') {
        console.error('Channel subscription timed out');
        onError(new Error('Connection timed out'));
      }
    });
  }

  // Start subscription
  subscribe();

  // Return channel for cleanup
  return channel;
}