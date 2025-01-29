import { loadStoryMessages } from './story-service';
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

export async function initializeMessageHistory(systemPrompt: string, storyId: string): Promise<void> {
  //console.log('Initializing message history with system prompt');
  
  // Load all narrator messages from the story
  const storyMessages = await loadStoryMessages(storyId);
  const narratorMessages = storyMessages
    .filter(msg => msg.type === 'narrator')
    .map(msg => ({
      role: 'assistant' as const,
      content: msg.content
    }));

  // Initialize history with system prompt and narrator messages
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

let storyContext: string | null = null;

async function summarizeMessages(messages: LLMMessage[]): Promise<string> {
  const contentToSummarize = messages
    .map(msg => msg.content)
    .join('\n\n');
  
  const summaryPrompt = `Summarize with text only the following story context into a concise paragraph, preserving key details like names, places, dates etc, maintaining narrative continuity:\n\n${contentToSummarize}`;
  console.log('context summaryPrompt:', summaryPrompt);

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: summaryPrompt }
    ],
    max_tokens: 512,
    temperature: 0.3,
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
  const maxHistory = Number(import.meta.env.VITE_LLM_MAX_HISTORY);
  
  // Always include the system message
  const systemMessage = messageHistory.find(msg => msg.role === 'system');
  if (!systemMessage) {
    console.error('No system message found in history!');
    throw new Error('No system message found');
  }

  // Get all non-system messages
  const allMessages = messageHistory.filter(msg => msg.role !== 'system');
  
  // Check if we need to summarize
  if (allMessages.length > maxHistory) {
    // Get latest 3 assistant messages
    const latestMessages = allMessages
      .filter(msg => msg.role === 'assistant')
      .slice(-3);
      
    if (latestMessages.length > 0) {
      try {

        // Only include existing storyContext if it has content
        const messagesToSummarize = [...latestMessages];
        if (storyContext && storyContext.trim().length > 0) {
          console.log('Incorporating existing story context into summary');
          messagesToSummarize.unshift({
            role: 'assistant',
            content: `Previous Story Context: ${storyContext}`
          });
        }

        storyContext = await summarizeMessages(messagesToSummarize);
        console.log('Created new story context:', storyContext);
        
        console.log('1 context messageHistory: ', messageHistory);
        // Remove the summarized messages from history
        messageHistory = messageHistory.filter(
          msg => !latestMessages.includes(msg)
        );
        console.log('2 context messageHistory: ', messageHistory);

      } catch (error) {
        console.error('Error summarizing messages:', error);
        // Fall back to removing oldest message if summarization fails
        messageHistory = messageHistory.slice(1);
      }
    }
  }

  // Get recent messages within limit
  const recentMessages = messageHistory
    .filter(msg => msg.role !== 'system')
    .slice(-maxHistory);

  // Build final messages array
  const messages = [systemMessage];
  
  // Add story context if available
  if (storyContext) {
    messages.push({
      role: 'user',
      content: `Story Context: ${storyContext}`
    });
  }

  messages.push(...recentMessages);
  
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

export async function aiOptimize(input: string): Promise<string> {
  const prompt = `Expand and enhance this text to make it more engaging and descriptive, while keeping it under 500 characters:\n\n${input}`;

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.7,
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
  const truncatedText = text.length > 1000 ? text.substring(0, 1000) : text;
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
    throw error;
  }
}