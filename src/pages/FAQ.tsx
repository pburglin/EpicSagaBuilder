import { Sparkles, Users, BookOpen, Sword, Shield, Palette } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface FAQSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FAQSection({ title, icon, children }: FAQSectionProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
}

function FAQItem({ question, children }: FAQItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{question}</h3>
      <div className="text-gray-600 space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
        
        <div className="max-w-4xl mx-auto">
          <FAQSection title="Getting Started" icon={<Sparkles className="h-6 w-6" />}>
            <FAQItem question="What is Eventfy Epic Saga Builder?">
              <p>
                Eventfy Epic Saga Builder is a collaborative storytelling platform where players and AI work
                together to create immersive fantasy adventures. You can either start your own story
                or join existing ones, creating unique characters and shaping the narrative through
                your actions.
              </p>
            </FAQItem>
            
            <FAQItem question="How do I start my first story?">
              <p className="mb-4">
                Starting a story is easy! Click the "Create New Story" button and follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Choose a compelling title and write an engaging description</li>
                <li>Set the maximum number of authors (2-10 players)</li>
                <li>Define available character classes and races</li>
                <li>Write an exciting starting scene and main quest</li>
                <li>Optionally add an image to set the mood</li>
              </ol>
            </FAQItem>
          </FAQSection>

          <FAQSection title="Character Creation" icon={<Users className="h-6 w-6" />}>
            <FAQItem question="How do I create a memorable character?">
              <p className="mb-4">
                A great character needs more than just stats. Consider these elements:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Give them a unique personality and background story</li>
                <li>Consider their motivations and goals</li>
                <li>Think about their relationships with others</li>
                <li>Choose a class and race that fits their story</li>
              </ul>
              <p>
                Remember: The most interesting characters often have flaws or quirks that make
                them relatable and human.
              </p>
            </FAQItem>

            <FAQItem question="What makes a good character description?">
              <p className="mb-4">
                Focus on these key elements in your character description:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Physical appearance and distinctive features</li>
                <li>Personality traits and mannerisms</li>
                <li>Brief background or origin story</li>
                <li>Special abilities or skills</li>
                <li>Goals and motivations</li>
              </ul>
            </FAQItem>
          </FAQSection>

          <FAQSection title="Collaborative Storytelling" icon={<BookOpen className="h-6 w-6" />}>
            <FAQItem question="How does collaborative storytelling work?">
              <p className="mb-4">
                Each player takes turns describing their character's actions. The AI narrator then
                weaves these actions together into a coherent narrative, creating dynamic and
                unexpected story developments.
              </p>
              <p>
                The key to great collaboration is building upon others' contributions while staying
                true to your character's personality and the story's theme.
              </p>
            </FAQItem>

            <FAQItem question="Tips for great storytelling">
              <ul className="list-disc list-inside space-y-2">
                <li>Read other characters' actions and react to them</li>
                <li>Use descriptive language to bring scenes to life</li>
                <li>Balance action with character development</li>
                <li>Respect the established tone and setting</li>
                <li>Give other players opportunities to shine</li>
              </ul>
            </FAQItem>
          </FAQSection>

          <FAQSection title="Game Mechanics" icon={<Sword className="h-6 w-6" />}>
            <FAQItem question="How do actions and turns work?">
              <p className="mb-4">
                When it's your turn, you can:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use quick actions for common activities</li>
                <li>Write custom actions for unique situations</li>
                <li>Interact with other characters</li>
                <li>Respond to the current scene</li>
              </ul>
            </FAQItem>

            <FAQItem question="What are the rules for combat and challenges?">
              <p>
                While there aren't strict rules like traditional RPGs, your actions should be
                reasonable for your character's class and abilities. The AI narrator will
                determine outcomes based on the context and narrative flow.
              </p>
            </FAQItem>
          </FAQSection>

          <FAQSection title="Story Management" icon={<Shield className="h-6 w-6" />}>
            <FAQItem question="How do I manage an active story?">
              <p className="mb-4">
                As a story participant, you can:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Vote to complete the story when it reaches a natural conclusion</li>
                <li>Leave the story if you can no longer participate</li>
                <li>Invite others to join if spots are available</li>
                <li>Report inappropriate content or behavior</li>
              </ul>
            </FAQItem>

            <FAQItem question="When should a story be completed?">
              <p>
                Consider completing a story when:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>The main quest has been resolved</li>
                <li>Character arcs have reached satisfying conclusions</li>
                <li>The narrative has naturally wound down</li>
                <li>All active players agree it's time to end</li>
              </ul>
            </FAQItem>
          </FAQSection>

          <FAQSection title="Best Practices" icon={<Palette className="h-6 w-6" />}>
            <FAQItem question="How can I improve my storytelling?">
              <ul className="list-disc list-inside space-y-2">
                <li>Read other successful stories for inspiration</li>
                <li>Practice descriptive writing</li>
                <li>Focus on character development</li>
                <li>Learn from feedback and interactions</li>
                <li>Experiment with different character types</li>
              </ul>
            </FAQItem>

            <FAQItem question="What makes a story successful?">
              <p className="mb-4">
                The best stories typically have:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Active participation from all players</li>
                <li>Rich character interactions</li>
                <li>Consistent world-building</li>
                <li>Balance between action and dialogue</li>
                <li>Satisfying character development</li>
              </ul>
            </FAQItem>
          </FAQSection>
        </div>
      </main>
      <Footer />
    </div>
  );
}