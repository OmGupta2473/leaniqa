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
          
          <p className="mb-6">Last updated: July 27, 2026</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By accessing or using the LeanIQA application, you agree to be bound by these Terms of Service. 
            If you disagree with any part of the terms, you may not access our service.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Description of Service</h2>
          <p className="mb-6">
            LeanIQA is a fitness and nutrition tracking tool. The information provided by our application, 
            including AI-generated nutritional estimates from Google Gemini, is for informational purposes only 
            and should not be considered medical advice. Always consult with a qualified healthcare provider 
            before starting any diet or exercise program.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. User Accounts</h2>
          <p className="mb-6">
            You must provide accurate and complete information when creating an account. You are responsible 
            for safeguarding the password that you use to access the service and for any activities or actions 
            under your password.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Acceptable Use</h2>
          <p className="mb-6">
            You agree not to misuse the application. You must not try to access the service using a method 
            other than the interface and the instructions that we provide.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">5. Disclaimer of Warranties</h2>
          <p className="mb-6">
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, 
            expressed or implied, and hereby disclaim and negate all other warranties including, without 
            limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, 
            or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">6. Contact Us</h2>
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
