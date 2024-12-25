import { Scale, Shield, AlertTriangle, FileText } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="prose prose-indigo max-w-none">
        {children}
      </div>
    </div>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12">Terms of Use</h1>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-700">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <Section title="Agreement to Terms" icon={<Scale className="h-6 w-6" />}>
            <p>
              By accessing or using Epic Saga Builder, you agree to be bound by these Terms of Use. 
              If you disagree with any part of these terms, you may not access or use the service.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Acceptance of Terms</h3>
            <p>
              These Terms of Use constitute a legally binding agreement between you and Epic Saga Builder 
              regarding your use of the service. By using the service, you represent that you are at 
              least 13 years of age.
            </p>
          </Section>

          <Section title="User Responsibilities" icon={<Shield className="h-6 w-6" />}>
            <h3 className="text-lg font-semibold mt-6 mb-3">Content Guidelines</h3>
            <p>You agree not to create or share content that:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Is unlawful, harmful, threatening, abusive, harassing, or discriminatory</li>
              <li>Infringes on any patent, trademark, trade secret, copyright, or other rights</li>
              <li>Contains malware, viruses, or any harmful code</li>
              <li>Impersonates any person or entity</li>
              <li>Promotes illegal activities</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Account Security</h3>
            <p>
              You are responsible for safeguarding your account credentials and for any activities 
              that occur under your account. Notify us immediately of any unauthorized use of your 
              account.
            </p>
          </Section>

          <Section title="Content Ownership & Rights" icon={<FileText className="h-6 w-6" />}>
            <h3 className="text-lg font-semibold mt-6 mb-3">User Content</h3>
            <p>
              You retain all rights to the content you create through the service. By submitting 
              content, you grant Epic Saga Builder a worldwide, non-exclusive, royalty-free license 
              to use, copy, modify, and display the content in connection with the service.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Intellectual Property</h3>
            <p>
              The service and its original content (excluding user-generated content) are protected 
              by copyright, trademark, and other laws. Our trademarks and trade dress may not be 
              used without our prior written permission.
            </p>
          </Section>

          <Section title="Disclaimers & Limitations" icon={<AlertTriangle className="h-6 w-6" />}>
            <h3 className="text-lg font-semibold mt-6 mb-3">No Warranty</h3>
            <p>
              The service is provided "as is" and "as available" without warranties of any kind, 
              either express or implied. We do not warrant that the service will be uninterrupted, 
              secure, or error-free.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Limitation of Liability</h3>
            <p>
              Epic Saga Builder and its operators shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages resulting from your use of or inability 
              to use the service.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">User Generated Content Disclaimer</h3>
            <p>
              Epic Saga Builder is not responsible for any user-generated content, including stories, 
              characters, or messages created by users. We do not endorse or guarantee the accuracy, 
              completeness, or usefulness of any user content.
            </p>
          </Section>

          <div className="bg-gray-50 border rounded-lg p-6 mt-12">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <p className="text-gray-600">
              If you have any questions about these Terms of Use, please contact us at:
              support@epicsagabuilder.com
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}