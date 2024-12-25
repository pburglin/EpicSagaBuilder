import { Story } from '../types';
import { MockLLM } from './mock-llm';
import { initializeMessageHistory, generateNarration } from './llm';
import { generateSystemPrompt } from './llm-prompts';

export class LLMFactory {
  static async create(story: Story) {
    const useMock = import.meta.env.VITE_USE_MOCK_LLM === 'true';
    
    if (useMock) {
      console.log('Using Mock LLM Service');
      return new MockLLM(story);
    }

    console.log('Using Real LLM Service');
    await initializeMessageHistory(generateSystemPrompt(story));
    return {
      generateResponse: async (type: 'action' | 'finale', prompt: string) => {
        return generateNarration(prompt);
      }
    };
  }
}