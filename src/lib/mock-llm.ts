import { Story } from '../types';

interface MockResponse {
  type: 'action' | 'finale';
  content: string;
}

const mockResponses: Record<string, MockResponse[]> = {
  'action': [
    {
      type: 'action',
      content: 'The party\'s actions echo through the chamber. The melee fighters engage the enemies head-on while ranged attackers provide support from the back. The healing magic flows where needed, keeping the group\'s strength up. The battle is intense but controlled, with each member playing their role effectively.'
    },
    {
      type: 'action',
      content: 'As the dust settles from the recent skirmish, the party finds themselves in a moment of relative calm. The enemies have been dealt with, but signs of more trouble lurk in the shadows ahead. The air is thick with tension, and everyone remains alert.'
    },
    {
      type: 'action',
      content: 'The group\'s cautious approach pays off. Their careful scouting reveals several hidden traps, which they manage to avoid. The dungeon\'s secrets slowly unveil themselves as the party works together, combining their various skills and abilities.'
    }
  ],
  'finale': [
    {
      type: 'finale',
      content: 'After countless challenges and memorable moments, our heroes emerge victorious. The quest that brought them together is complete, but the bonds forged in battle will last a lifetime. Their names will be remembered in tavern tales and bards\' songs for generations to come.'
    }
  ]
};

let currentActionIndex = 0;

export class MockLLM {
  private story: Story;

  constructor(story: Story) {
    this.story = story;
  }

  async generateResponse(type: 'action' | 'finale'): Promise<{ text: string; imageUrl?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (type === 'finale') {
      return {
        text: this.generateFinaleResponse(),
        imageUrl: 'https://example.com/finale-image.jpg'
      };
    }

    return {
      text: this.generateActionResponse()
    };
  }

  private generateActionResponse(): string {
    const responses = mockResponses['action'];
    const response = responses[currentActionIndex % responses.length];
    currentActionIndex++;
    
    return this.personalizeResponse(response.content);
  }

  private generateFinaleResponse(): string {
    const responses = mockResponses['finale'];
    const response = responses[0];
    return this.personalizeResponse(response.content);
  }

  private personalizeResponse(content: string): string {
    // Replace generic terms with specific character names and details
    let personalized = content;
    
    this.story.characters.forEach(char => {
      personalized = personalized.replace(
        /(fighters|attackers|party members)/g,
        char.name
      );
    });

    return personalized;
  }
}