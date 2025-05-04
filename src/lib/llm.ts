import { loadStoryMessages, loadStoryContext, updateStoryContext } from './story-service';
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
let storyId: string = '';
let coreStoryFacts: string = ''; // Tier 1: Core story facts
let recentMessageBuffer: LLMMessage[] = []; // Tier 2: Recent messages
let summarizedChunks: string[] = []; // Tier 3: Summarized older messages

export async function initializeMessageHistory(systemPrompt: string, inStoryId: string): Promise<void> {
  //console.log('Initializing message history with system prompt');

  storyId = inStoryId;
  
  // Load story context from the database into coreStoryFacts
  coreStoryFacts = await loadStoryContext(storyId);

  // Load all narrator messages from the story into recentMessageBuffer
  const storyMessages = await loadStoryMessages(storyId);

  recentMessageBuffer = storyMessages
    .filter(msg => msg.type === 'narrator')
    .map(msg => ({
      role: 'assistant' as const,
      content: msg.content
    }));

  // Add the system prompt to the beginning of the recentMessageBuffer
  recentMessageBuffer.unshift({ role: 'system', content: systemPrompt });

  console.log('Message history initialized with:', {
    coreStoryFacts: coreStoryFacts.length > 0 ? 'Loaded' : 'Empty',
    recentMessageBufferLength: recentMessageBuffer.length
  });

  console.log('recentMessageBuffer: ', recentMessageBuffer);
}

// Remove the old summarizeMessages function
async function summarizeMessages(messages: LLMMessage[]): Promise<string> {
  throw new Error("summarizeMessages is deprecated and should not be called.");
}

// Simple token estimation (characters / 4 is a common approximation)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Implement new context management functions here
// async function extractKeyFacts(messages: LLMMessage[]): Promise<string> { ... }
// async function compressMessageBuffer(messages: LLMMessage[]): Promise<LLMMessage[]> { ... }

async function getMessageHistory(): Promise<LLMMessage[]> {
  const messagesToSend: LLMMessage[] = [];
  // Allow some buffer to avoid exceeding the token limit exactly
  const maxTokens = Number(import.meta.env.VITE_LLM_MAX_TOKENS || 1024) * 0.9; 
  let currentTokenCount = 0;

  // 1. Add System Prompt (always included)
  const systemMessage = recentMessageBuffer.find(msg => msg.role === 'system');
  if (systemMessage) {
    messagesToSend.push(systemMessage);
    currentTokenCount += estimateTokens(systemMessage.content);
  }

  // 2. Add Core Story Facts (if available)
  if (coreStoryFacts) {
    const coreFactsMessage: LLMMessage = { role: 'system', content: `Core Story Facts: ${coreStoryFacts}` };
    const coreFactsTokenCount = estimateTokens(coreFactsMessage.content);
    if (currentTokenCount + coreFactsTokenCount <= maxTokens) {
      messagesToSend.push(coreFactsMessage);
      currentTokenCount += coreFactsTokenCount;
    } else {
      console.warn('Not enough space for core story facts in context window.');
    }
  }

  // 3. Add Summarized Chunks (oldest first, as space allows)
  for (const chunk of summarizedChunks) {
    const chunkMessage: LLMMessage = { role: 'assistant', content: `Summary of previous events: ${chunk}` };
    const chunkTokenCount = estimateTokens(chunkMessage.content);
    if (currentTokenCount + chunkTokenCount <= maxTokens) {
      messagesToSend.push(chunkMessage);
      currentTokenCount += chunkTokenCount;
    } else {
      console.warn('Not enough space for all summarized chunks in context window.');
      break; // Stop adding chunks if limit is reached
    }
  }

  // 4. Add Recent Messages (most recent first, as space allows)
  const recentMessagesToAdd: LLMMessage[] = [];
  for (let i = recentMessageBuffer.length - 1; i >= 0; i--) {
    const message = recentMessageBuffer[i];
    if (message.role === 'system') continue; // System message already added

    const messageTokenCount = estimateTokens(message.content);
    if (currentTokenCount + messageTokenCount <= maxTokens) {
      recentMessagesToAdd.unshift(message); // Add to the beginning to maintain chronological order
      currentTokenCount += messageTokenCount;
    } else {
      console.warn('Not enough space for all recent messages in context window.');
      break; // Stop adding recent messages if limit is reached
    }
  }
  messagesToSend.push(...recentMessagesToAdd);


  console.log('Constructed message history for LLM:', {
    messageCount: messagesToSend.length,
    currentTokenCount: currentTokenCount
  });

  return messagesToSend;
}

async function addMessageToHistory(message: LLMMessage): Promise<void> {
  // Add new messages to the recentMessageBuffer
  recentMessageBuffer.push(message);
  console.log('Added message to recentMessageBuffer:', {
    role: message.role,
    contentPreview: message.content.slice(0, 50) + '...',
    totalMessages: recentMessageBuffer.length
  });

  // TODO: Implement logic to manage recentMessageBuffer size and create summarized chunks
  // For now, a simple trimming to a fixed size
  const maxRecentMessages = 20; // Example: Keep up to 20 recent messages
  if (recentMessageBuffer.length > maxRecentMessages) {
    // Keep the system message and the most recent messages
    const systemMessage = recentMessageBuffer.find(msg => msg.role === 'system');
    const messagesToKeep = systemMessage ? [systemMessage, ...recentMessageBuffer.slice(-(maxRecentMessages - 1))] : recentMessageBuffer.slice(-maxRecentMessages);
    
    // TODO: Summarize the removed messages and add to summarizedChunks
    const removedMessages = recentMessageBuffer.slice(systemMessage ? 1 : 0, -(maxRecentMessages - (systemMessage ? 1 : 0)));
    if (removedMessages.length > 0) {
      console.log(`Need to summarize ${removedMessages.length} old messages.`);
      // This is where the summarize/extract key facts logic would be called
      // For now, just discard them
    }

    recentMessageBuffer = messagesToKeep;
    console.log(`Trimmed recentMessageBuffer to ${recentMessageBuffer.length} messages.`);
  }
}

export async function aiOptimize(input: string): Promise<string> {
  const prompt = `Expand and enhance this text to make it more engaging and descriptive, while keeping it under 500 characters:\n\n${input}`;

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: Number(import.meta.env.VITE_LLM_SUMMARY_TOKENS || 512),
    temperature: Number(import.meta.env.VITE_LLM_STORY_TEMPERATURE || 0.7),
  };

  try {
    const response = await fetch(import.meta.env.VITE_LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + import.meta.env.VITE_LLM_API_KEY
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to optimize text: ${error}`);
    }

    const data: LLMResponse = await response.json();
    const content = data.choices[0]?.message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return content.slice(0, 500); // Ensure it's within limit
  } catch (error) {
    console.error('Error optimizing text:', error);
    throw error;
  }
}

async function generateImageFromText(text: string): Promise<string> {
  const imagePromptMaxChars = Number(import.meta.env.VITE_IMAGE_PROMPT_MAX_CHARS || 1024);
  const truncatedText = text.length > imagePromptMaxChars ? text.substring(0, imagePromptMaxChars) : text;
  const imagePrompt = `https://image.pollinations.ai/prompt/anime style ${truncatedText}`;
  console.log('imagePrompt: ', imagePrompt);
  return imagePrompt;
}

export async function generateNarration(prompt: string): Promise<{ text: string; imageUrl?: string }> {
  // Add user prompt to history first
  await addMessageToHistory({ role: 'user', content: prompt });
  
  // Get message history including the new prompt
  const messages = await getMessageHistory();
  
  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages,
    max_tokens: Number(import.meta.env.VITE_LLM_MAX_TOKENS || 1024),
    temperature: Number(import.meta.env.VITE_LLM_STORY_TEMPERATURE || 0.7),
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
        'Authorization': 'Bearer ' + import.meta.env.VITE_LLM_API_KEY
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

    let content = data.choices[0]?.message.content;
    if (!content) {
      console.error('❌ LLM Response Error: No content in response');
      throw new Error('No content in response');
    }

    // Store assistant's response in history
    await addMessageToHistory({ role: 'assistant', content });

    // if message is incomplete, request LLM to finish its previous response
    if (data.choices[0] && data.choices[0]?.finish_reason==='length') {
      console.log('Requested LLM to complete its last message');
      const nextPart = await generateNarration("Continue and complete the last message with role assistant.");
      content += nextPart;
    }

    console.log('final content:', content);

    // Update response time tracking
    const endTime = Date.now();
    updateLastResponseTime(startTime, endTime);

    let imageUrl: string | undefined;
    try {
      imageUrl = await generateImageFromText(content);
      console.log('Generated image URL:', imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      // Continue without image if generation fails
    }

    return { text: content, imageUrl };
  } catch (error) {
    console.error('Error generating narration:', error);
    // Return an empty response instead of throwing an error
    return { text: 'An error occurred while generating the narration. Please try again later.' };
  }
}
