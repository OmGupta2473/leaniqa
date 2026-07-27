import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
          
          <p className="mb-6">Last updated: July 27, 2026</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Data We Collect</h2>
          <p className="mb-4">To provide you with our fitness and nutrition tracking services, we collect the following personal and health-related information:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li><strong>Account Information:</strong> Email address and name.</li>
            <li><strong>Physical Profile:</strong> Age, weight, height, and body fat percentage.</li>
            <li><strong>Activity Data:</strong> Meal and nutrition entries, daily habits, and progress logs.</li>
            <li><strong>Usage Analytics:</strong> Information on how you interact with our application to help us improve the experience.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Third-Party Processors</h2>
          <p className="mb-4">We use trusted third-party services to operate our application. Your data may be processed by:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li><strong>Supabase:</strong> For authentication and secure database hosting.</li>
            <li><strong>Google Gemini:</strong> For AI-powered meal parsing and nutrition estimation.</li>
            <li><strong>Sentry:</strong> For crash reporting and application stability monitoring.</li>
            <li><strong>PostHog:</strong> For usage analytics and feature improvement.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. Data Deletion</h2>
          <p className="mb-6">
            You have the right to request the deletion of your personal data at any time. 
            You can delete your account directly through the Profile settings within the app, 
            which will permanently wipe your profile and associated logs from our database.
            Alternatively, you can contact us to process your deletion request.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Contact Us</h2>
          <p className="mb-6">
            If you have any questions or concerns about this Privacy Policy, please contact us at: 
            <br />
            <a href="mailto:privacy@leaniqa.com" className="text-[#D4FF00] hover:underline mt-2 inline-block">privacy@leaniqa.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
