import { Story } from '../types';
import { updateLastResponseTime } from './llm-store';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Message history management
let messageHistory: LLMMessage[] = [];

export async function initializeMessageHistory(systemPrompt: string): Promise<void> {
  console.log('Initializing message history with system prompt');
  messageHistory = [{ role: 'system', content: systemPrompt }];
}

async function getMessageHistory(): Promise<LLMMessage[]> {
  const maxHistory = Number(import.meta.env.VITE_LLM_MAX_HISTORY);
  
  // Always include the system message
  const systemMessage = messageHistory.find(msg => msg.role === 'system');
  if (!systemMessage) {
    console.error('No system message found in history!');
    throw new Error('No system message found');
  }

  // Get recent non-system messages
  const recentMessages = messageHistory
    .filter(msg => msg.role !== 'system')
    .slice(-maxHistory);

  const messages = [systemMessage, ...recentMessages];
  console.log('Current message history:', {
    total: messageHistory.length,
    included: messages.length,
    roles: messages.map(m => m.role)
  });

  return messages;
}

async function addMessageToHistory(message: LLMMessage): Promise<void> {
  messageHistory.push(message);
  console.log('Added message to history:', {
    role: message.role,
    contentPreview: message.content.slice(0, 50) + '...',
    totalMessages: messageHistory.length
  });
}

export async function generateNarration(prompt: string): Promise<string> {
  // Add user prompt to history first
  await addMessageToHistory({ role: 'user', content: prompt });
  
  // Get message history including the new prompt
  const messages = await getMessageHistory();
  
  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages,
    max_tokens: Number(import.meta.env.VITE_LLM_MAX_TOKENS),
    temperature: 0.7,
  };

  console.log('🚀 LLM Request:', {
    endpoint: import.meta.env.VITE_LLM_API_ENDPOINT,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1].content.slice(0, 50) + '...'
  });

  try {
    const startTime = Date.now();
    const response = await fetch(import.meta.env.VITE_LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ LLM Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`Failed to generate narration: ${error}`);
    }

    const data: LLMResponse = await response.json();
    console.log('✅ LLM Response:', {
      id: data.id,
      model: data.model,
      contentPreview: data.choices[0]?.message.content.slice(0, 50) + '...',
      finishReason: data.choices[0]?.finish_reason
    });

    const content = data.choices[0]?.message.content;

    if (!content) {
      console.error('❌ LLM Response Error: No content in response');
      throw new Error('No content in response');
    }

    // Store assistant's response in history
    await addMessageToHistory({ role: 'assistant', content });

    // Update response time tracking
    const endTime = Date.now();
    updateLastResponseTime(startTime, endTime);

    return content;
  } catch (error) {
    console.error('Error generating narration:', error);
    throw error;
  }
}