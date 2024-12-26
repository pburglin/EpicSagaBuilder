import { Story, Character, Message } from '../types';
import { generateActionPrompt, generateFinalePrompt } from './llm-prompts';
import { LLMFactory } from './llm-factory';
import { sendCharacterMessage, sendNarratorMessage } from './story-service';

interface PendingAction {
  character: Character;
  action: string;
}

export class StorySessionManager {
  private story: Story;
  private pendingActions: Map<string, PendingAction>;
  private currentScene: string;
  private llmService: { generateResponse: (type: 'action' | 'finale', prompt: string) => Promise<string> };

  constructor(story: Story) {
    this.story = story;
    this.pendingActions = new Map();
    this.currentScene = story.startingScene;
  }

  async initialize(): Promise<void> {
    // Initialize LLM service
    this.llmService = await LLMFactory.create(this.story);
  }

  async submitAction(character: Character, action: string): Promise<void> {
    this.pendingActions.set(character.id, { character, action });

    // Send character message immediately
    await sendCharacterMessage(this.story.id, character.id, action);

    // Check if all active characters have submitted actions
    const activeCharacters = this.story.characters.filter(char => char.status === 'active');
    if (this.pendingActions.size === activeCharacters.length) {
      await this.processRound();
    }
  }

  private async processRound(): Promise<void> {
    const actions = Array.from(this.pendingActions.values());
    
    // Generate and send narration
    const prompt = generateActionPrompt(this.currentScene, actions);
    const narration = await this.llmService.generateResponse('action', prompt);
    await sendNarratorMessage(this.story.id, narration);

    // Update current scene and clear pending actions
    this.currentScene = narration;
    this.pendingActions.clear();
  }

  async completeStory(character: Character): Promise<void> {
    // Send completion message
    const completionMessage = `${character.name} has marked the story as complete. Preparing the grand finale...`;
    await sendCharacterMessage(this.story.id, character.id, completionMessage);

    // Generate and send finale
    const finalePrompt = generateFinalePrompt(this.story);
    const finale = await this.llmService.generateResponse('finale', finalePrompt);
    
    // Add a dramatic pause before the finale
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send the finale in an epic format
    const formattedFinale = 
      "🌟 EPIC FINALE 🌟\n\n" +
      finale + "\n\n" +
      "THE END";
    
    await sendNarratorMessage(this.story.id, formattedFinale);
  }

  isWaitingForAction(characterId: string): boolean {
    return !this.pendingActions.has(characterId);
  }

  getPendingActionsCount(): number {
    return this.pendingActions.size;
  }

  getRequiredActionsCount(): number {
    return this.story.characters.filter(char => char.status === 'active').length;
  }
}