import { Story, Character } from '../types';

export function generateSystemPrompt(story: Story): string {
  const charactersInfo = story.characters
    .filter(char => char.status === 'active')
    .map(char => `${char.name} (${char.race} ${char.class}): ${char.description}`)
    .join('\n');

  return `${import.meta.env.VITE_LLM_SYSTEM_PROMPT}

Title: ${story.title}

${story.storyMechanics}

Characters:
${charactersInfo}`;
}

export function generateActionPrompt(
  characterActions: { character: Character; action: string }[]
): string {
  const actionsDescription = characterActions
    .map(({ character, action }) => `${character.name}: ${action}`)
    .join('\n');

  return `Character Actions:

${actionsDescription}

Describe the outcome of these actions and the resulting scene.`;
}

export function generateFinalePrompt(story: Story): string {
  const charactersInfo = story.characters
    .filter(char => char.status === 'active')
    .map(char => `- ${char.name} (${char.race} ${char.class})`)
    .join('\n');

  return `Create an epic and memorable finale for the story "${story.title}".

Context:
- Story: ${story.description}
- Main Quest: ${story.mainQuest}

Active Heroes:
${charactersInfo}

Create a dramatic conclusion that:
1. Resolves the main quest
2. Acknowledges each character's unique contributions
3. Provides a satisfying ending worthy of legend
4. Leaves a lasting impact on the world

Make it epic, emotional, and memorable!

Do not include emogis, hashtags or other special characters in your response.`;
}