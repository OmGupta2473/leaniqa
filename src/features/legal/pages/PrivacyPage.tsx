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
          
          <p className="mb-6">Last updated: October 2026</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">The short version</h2>
          <p className="mb-6">We collect what we need to run LeaniQA — your account, your body stats, what you eat. We don't sell your data. This page explains the details.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. What we collect</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Account information</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Your email address (if you sign up with email)</li>
            <li>Your name and profile picture (if you sign in with Google)</li>
            <li>A unique user ID we generate for you</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Physical profile</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Age, sex, height, weight, body fat percentage</li>
            <li>Activity level, dietary preference, training style</li>
            <li>Goals (lose fat, recomp, build muscle) and pace</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">What you eat</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Meal descriptions you type</li>
            <li>Calories, protein, fat, carbs, fiber</li>
            <li>When you ate and which meal slot</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">How you use the app</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Page views, feature interactions</li>
            <li>Crash reports if the app errors</li>
            <li>AI parse count (to track your daily credit use)</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Where your data goes</h2>
          <p className="mb-4">We use a small number of trusted services. Here is what each one does and what they see.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Supabase — database and authentication</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Stores: account, meals, goals, weight logs, chat messages</li>
            <li>Sees: everything in your account</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Google (Gemini) and Groq — AI meal parsing</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>We send: the text you type when logging a meal</li>
            <li>They return: calories, macros, a short coaching tip</li>
            <li>They do not store your meal text long-term</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">PostHog — product analytics</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>We send: events like "meal logged", "onboarding completed", your user ID</li>
            <li>We do NOT send: meal text, weight, or health data</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Sentry — crash reporting</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>We send: errors, stack traces, your user ID</li>
            <li>We do NOT send: meal text or health data</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. Guest accounts</h2>
          <p className="mb-6">You can use LeaniQA without signing up. When you tap "Continue as guest":</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>We create an anonymous account just for this device</li>
            <li>Your meals, goals, and stats are saved under that anonymous ID</li>
            <li>The data lives only on this device until you link Google or email</li>
            <li>If you clear your browser data or switch devices, we cannot recover it</li>
          </ul>
          <p className="mb-6">You can link a Google account later to keep your data and use LeaniQA on any device.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. What stays on your device</h2>
          <p className="mb-4">We store two small pieces of information in your browser:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Your anonymous user ID (so guest mode works across refreshes)</li>
            <li>A "don't ask again" timestamp for the progress prompt (24 hours)</li>
          </ul>
          <p className="mb-6">We also use a secure cookie from Supabase to keep you logged in. No third-party advertising cookies. No tracking pixels.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. How long we keep your data</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>Active account: as long as you use LeaniQA</li>
            <li>After you delete your account: removed within 30 days</li>
            <li>Guest accounts with no activity: deleted after 30 days</li>
            <li>Crash reports: 90 days</li>
            <li>Analytics events: 12 months</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Where we store it</h2>
          <p className="mb-6">Our database is hosted by Supabase. Analytics and crash reports are stored on PostHog and Sentry servers. These providers may store your data outside your home country. We rely on their standard contractual clauses for international transfers.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">5. Your rights</h2>
          <p className="mb-4">You can:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[rgba(255,255,255,0.7)]">
            <li>See your data — everything you've logged is visible in the app</li>
            <li>Export your data — email privacy@leaniqa.com</li>
            <li>Delete your account — from Profile → Danger zone, or email us</li>
            <li>Ask us anything about how we handle your data</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">6. Deleting your account</h2>
          <p className="mb-6">Go to Profile → Danger zone to delete your account. We remove your data within 30 days. You can also email privacy@leaniqa.com.</p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">7. Contact</h2>
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