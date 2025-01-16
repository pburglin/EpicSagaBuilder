import { Story, Character } from '../types';
import { generateActionPrompt, generateFinalePrompt } from './llm-prompts';
import { LLMFactory } from './llm-factory';
import { sendCharacterMessage, sendNarratorMessage, startNewRound, recordPlayerAction } from './story-service';

interface PendingAction {
  character: Character;
  action: string;
}

export class StorySessionManager {
  private story: Story;
  private pendingActions: Map<string, PendingAction>;
  private currentRoundId: string | null;
  private currentScene: string;
  private llmService: { generateResponse: (type: 'action' | 'finale', prompt: string) => Promise<{ text: string; imageUrl?: string }> } = {
    generateResponse: async () => ({ text: '' }) // Default implementation
  };

  constructor(story: Story) {
    this.story = story;
    this.pendingActions = new Map();
    this.currentRoundId = null;
    this.currentScene = story.startingScene;
  }

  async initialize(): Promise<void> {
    // Initialize LLM service
    this.llmService = await LLMFactory.create(this.story);
    
    // Start first round
    this.currentRoundId = await startNewRound(this.story.id);
  }

  async submitAction(character: Character, action: string): Promise<void> {
    this.pendingActions.set(character.id, { character, action });

    // Send character message immediately
    await sendCharacterMessage(this.story.id, character.id, action);

    // Record player action
    if (this.currentRoundId) {
      await recordPlayerAction(this.currentRoundId, character.id);
    }

    // Check if all active characters have submitted actions
    const activeCharacters = this.story.characters.filter(char => char.status === 'active');
    if (this.pendingActions.size === activeCharacters.length) {
      console.log('All active characters submitted actions, lets complete the round');
      await this.processRound();
    } else {
      console.log('Waiting for ' + (activeCharacters.length - this.pendingActions.size) + ' character(s) to complete the round...');
    }
  }

  private async processRound(): Promise<void> {
    const actions = Array.from(this.pendingActions.values());
    
    // Generate and send narration
    const prompt = generateActionPrompt(this.currentScene, actions);
    console.log('prompt: ', prompt);
    const { text: narration } = await this.llmService.generateResponse('action', prompt);
    console.log('narration: ', narration);

    await sendNarratorMessage(this.story.id, narration);

    // Update current scene and clear pending actions
    this.currentScene = narration;
    this.pendingActions.clear();
    
    // Start new round
    this.currentRoundId = await startNewRound(this.story.id);
    //console.log('currentRoundId: ', currentRoundId);
  }

  async completeStory(character: Character): Promise<void> {
    // Send completion message
    const completionMessage = `${character.name} has marked the story as complete. Preparing the grand finale...`;
    await sendCharacterMessage(this.story.id, character.id, completionMessage);

    // Generate and send finale
    const finalePrompt = generateFinalePrompt(this.story);
    const { text: finale } = await this.llmService.generateResponse('finale', finalePrompt);
    console.log('finale: ', finale);

    // Parse content as JSON if it contains both text and imageUrl
    let messageText = finale;
    let imageUrl: string | undefined;
    
    try {
      const parsedContent = JSON.parse(finale);
      if (parsedContent.text && typeof parsedContent.text === 'string') {
        messageText = parsedContent.text;
        imageUrl = parsedContent.imageUrl;
      }
    } catch {
      // Content is not JSON, use as-is
    }

    // Send the finale in an epic format
    const formattedFinale =
      "🌟 EPIC FINALE 🌟\n\n" +
      (typeof messageText === 'object' ? JSON.stringify(messageText, null, 2) : messageText) + "\n\n" +
      (imageUrl ? `📷 ${imageUrl}\n\n` : '') +
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