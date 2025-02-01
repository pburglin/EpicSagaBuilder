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
let messageHistory: LLMMessage[] = [];

let storyId: string = '';
let storyContext: string = '';

export async function initializeMessageHistory(systemPrompt: string, inStoryId: string): Promise<void> {
  //console.log('Initializing message history with system prompt');

  storyId = inStoryId;
  
  // Load story context from the database
  storyContext = await loadStoryContext(storyId);

  // Load all narrator messages from the story
  const storyMessages = await loadStoryMessages(storyId);

  const narratorMessages = storyMessages
    .filter(msg => msg.type === 'narrator')
    .map(msg => ({
      role: 'assistant' as const,
      content: msg.content
    }));

  // Initialize history with system prompt and narrator messages only
  // Excludes user character messages
  messageHistory = [
    { role: 'system', content: systemPrompt },
    ...narratorMessages
  ];

  console.log('Message history initialized with:', {
    totalMessages: messageHistory.length,
    narratorMessages: narratorMessages.length
  });

  console.log('messageHistory: ', messageHistory);
}

async function summarizeMessages(messages: LLMMessage[]): Promise<string> {

  let contentToSummarize = '';
  let totalSize = 0;
  const maxSize = 10 * 1024; // 10KB

  // Summarize messages in reverse order, from most recent to oldest
  for (let i = messages.length - 1; i >= 1; i--) {
    const msg = messages[i];
    const messageContent = msg.content + '\n\n';
    const messageSize = new TextEncoder().encode(messageContent).length;

    if (totalSize + messageSize > maxSize) {
      console.log('maxSize exceeded, breaking to avoid LLM limits but we will lose some context');
      console.log('totalSize:', totalSize);
      console.log('i:', i);
      break;
    }

    contentToSummarize = messageContent + contentToSummarize;
    totalSize += messageSize;
  }
  
  // always add current story context to the beginning
  contentToSummarize = messages[0].content + '\n\n' + contentToSummarize;

  const summaryPrompt = `Summarize the following story context with text only into a concise paragraph, preserving key details like character names, gender, places, dates etc, maintaining narrative continuity:\n\n${contentToSummarize}`;
  console.log('context summaryPrompt:', summaryPrompt);

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: summaryPrompt }
    ],
    max_tokens: Number(import.meta.env.VITE_LLM_SUMMARY_TOKENS || 512),
    temperature: Number(import.meta.env.VITE_LLM_SUMMARY_TEMPERATURE || 0.3),
  };

  const response = await fetch(import.meta.env.VITE_LLM_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + import.meta.env.VITE_LLM_API_KEY
    },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    throw new Error('Failed to summarize messages');
  }

  const data: LLMResponse = await response.json();
  return data.choices[0]?.message.content || '';
}

async function getMessageHistory(): Promise<LLMMessage[]> {
  
  // Always include the system message
  const systemMessage = messageHistory.find(msg => msg.role === 'system');
  if (!systemMessage) {
    console.error('No system message found in history!');
    throw new Error('No system message found');
  }

  // Get all assistant messages to update story summary
  const messagesToSummarize = messageHistory.filter(msg => msg.role === 'assistant');
  
  // Update story summary
  console.log('Starting message summarization');
  console.log('messagesToSummarize.length: ', messagesToSummarize.length);

  try {
    // include existing storyContext if it exists
    if (storyContext && storyContext.trim().length > 0) {
      console.log('Incorporating existing story context into summary: ', storyContext);
      messagesToSummarize.unshift({
        role: 'assistant',
        content: `${storyContext}`
      });
    }
    console.log('messagesToSummarize:', messagesToSummarize);

    //console.log('1 context messageHistory: ', messageHistory);

    storyContext = await summarizeMessages(messagesToSummarize);
    console.log('New story context:', storyContext);
    
    // Update story context in database
    if (storyId) {
      await updateStoryContext(storyId, storyContext);
    } else {
      console.error('No storyId found, cannot persist story context');
    }
    
    // Remove the summarized messages from history
    messageHistory = messageHistory.filter(
      msg => !messagesToSummarize.includes(msg)
    );
    //console.log('2 context messageHistory: ', messageHistory);

  } catch (error) {
    console.error('Error summarizing messages:', error);
    // Fall back to removing oldest message if summarization fails; do not remove system message
    messageHistory = messageHistory.slice(1,1);
  }

  // Inject story context if available
  // messageHistory format will be:
  // 1. system prompt with story mechanics
  // 2. updated story context
  // 3. most recent assistant messages, as many we can fit without causing prompt to exceed max tokens
  // 4. user message
  
  //console.log('Final storyContext: ', storyContext);
  if (storyContext) {
    messageHistory.splice(1, 0,{
      role: 'assistant',
      content: `${storyContext}`
    });
  }
  
  console.log('Final message history:', messageHistory);

  return messageHistory;
}

async function addMessageToHistory(message: LLMMessage): Promise<void> {
  messageHistory.push(message);
  console.log('Added message to history:', {
    role: message.role,
    contentPreview: message.content.slice(0, 50) + '...',
    totalMessages: messageHistory.length
  });
}

export async function aiOptimize(input: string): Promise<string> {
  const prompt = `Expand and enhance this text to make it more engaging and descriptive, while keeping it under 500 characters:\n\n${input}`;

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: import.meta.env.VITE_LLM_SUMMARY_TOKENS || 512,
    temperature: import.meta.env.VITE_LLM_STORY_TEMPERATURE || 0.7,
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