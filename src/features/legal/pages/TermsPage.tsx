import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 md:p-12 overflow-y-auto font-sans">
      {/* 
        NOTE: This is placeholder/template content and MUST be reviewed by someone 
        qualified before the app processes real payments or scales beyond a small beta. 
        This does not replace a lawyer, especially given DPDP Act 2023 obligations 
        for apps handling health-adjacent data in India.
      */}
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="prose prose-invert prose-p:text-[rgba(255,255,255,0.7)] prose-headings:text-white max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
          
          <p className="mb-6">Last updated: October 2026</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">The short version</h2>
          <p className="mb-6">Use LeaniQA to track your nutrition. Don't abuse it. The numbers we give you are estimates, not medical advice. See a doctor before making big changes to your diet.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Acceptance</h2>
          <p className="mb-6">By using LeaniQA, you agree to these terms. If you don't agree, please don't use the app.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. What LeaniQA is</h2>
          <p className="mb-6">LeaniQA is a fitness tracking tool. We help you:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Log meals with AI-assisted parsing</li>
            <li>Track calories, protein, fat, and carbs</li>
            <li>Hit nutrition goals (fat loss, recomp, muscle gain)</li>
            <li>See progress over time</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. What LeaniQA is not</h2>
          <p className="mb-4"><strong>Not medical advice.</strong></p>
          <p className="mb-4">We are a nutrition tracker, not a doctor, dietitian, or medical provider. Nothing in LeaniQA diagnoses, treats, or cures any condition. Talk to a qualified healthcare professional before changing your diet, starting a new training program, or if you have any medical condition.</p>
          <p className="mb-4"><strong>Not 100% accurate.</strong></p>
          <p className="mb-4">AI meal parsing estimates calories and macros from what you type. Results vary. Weight tracking is only as accurate as your scale. Progress projections are estimates based on math, not guarantees.</p>
          <p className="mb-4"><strong>Not responsible for outcomes.</strong></p>
          <p className="mb-4">We give you tools and information. What you do with them is up to you.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Your account</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Keep your login details safe</li>
            <li>Don't share your account</li>
            <li>Provide accurate information — age, weight, etc. affect your targets</li>
            <li>You're responsible for anything that happens under your account</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">5. Guest accounts</h2>
          <p className="mb-4">You can try LeaniQA without signing up. Guest data lives on your device only. If you clear your browser or switch devices, we can't recover it. Link a Google account anytime to keep your data.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">6. Acceptable use</h2>
          <p className="mb-4">Don't:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Use LeaniQA to break any law</li>
            <li>Try to break, hack, or overload the app</li>
            <li>Use AI parsing to spam or abuse the service</li>
            <li>Copy our code, design, or content for another product</li>
            <li>Resell access to LeaniQA</li>
          </ul>
          <p className="mb-6">We can suspend or terminate accounts that violate these rules.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">7. Subscriptions and refunds</h2>
          <p className="mb-6">Some features require a paid subscription. See our <a href="/refund" className="text-[#D4FF00] hover:underline">Refund Policy</a> for cancellation and refund details.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">8. Your content</h2>
          <p className="mb-4">You own your content. Your meal logs, chat messages, and notes are yours. We only use them to run the app (compute your targets, show your history, sync across devices).</p>
          <p className="mb-6">We own the app itself: code, design, brand, algorithms.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">8. Termination</h2>
          <p className="mb-6">You can delete your account anytime from Profile. We can terminate your account if you break these terms, abuse the service, or if we shut down LeaniQA.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">9. Limits on our liability</h2>
          <p className="mb-4">To the maximum extent allowed by law: LeaniQA is provided "as is". We don't guarantee it will work perfectly, be available at all times, or that AI-parsed macros are accurate. We are not liable for any indirect, incidental, or consequential damages from using the app.</p>
          <p className="mb-6">Nothing in these terms limits our liability for anything that cannot legally be limited.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">9. Changes</h2>
          <p className="mb-6">We may update these terms. If we make big changes, we'll tell you in the app. Continued use after changes means you accept them.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">10. Contact</h2>
          <p className="mb-6">
            If you have any questions about these Terms, please contact us at:
            <br />
            <a href="mailto:support@leaniqa.com" className="text-[#D4FF00] hover:underline mt-2 inline-block">support@leaniqa.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}