import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function RefundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 md:p-12 overflow-y-auto font-sans">
      {/* 
        NOTE: This is placeholder/template content and MUST be reviewed by someone 
        qualified before the app processes real payments or scales beyond a small beta. 
        This is a requirement for Razorpay merchant approval.
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Refund & Cancellation Policy</h1>
          
          <p className="mb-6">Last updated: July 27, 2026</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Subscription Cancellations</h2>
          <p className="mb-6">
            You can cancel your subscription at any time through your account settings. 
            Once canceled, you will continue to have access to the premium features until the end 
            of your current billing cycle. We do not provide prorated refunds for mid-cycle cancellations.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Refund Eligibility</h2>
          <p className="mb-6">
            We offer a 7-day money-back guarantee for all initial subscription purchases. 
            If you are not satisfied with the service, you may request a full refund within 7 days 
            of your first payment. Renewal payments are strictly non-refundable.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. Processing Refunds</h2>
          <p className="mb-6">
            Approved refunds will be processed within 5-7 business days and will be credited back 
            to the original method of payment used during the purchase.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Contact for Refunds</h2>
          <p className="mb-6">
            To request a refund or if you have any questions regarding your billing, please contact our support team at:
            <br />
            <a href="mailto:billing@leaniqa.com" className="text-[#D4FF00] hover:underline mt-2 inline-block">billing@leaniqa.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
