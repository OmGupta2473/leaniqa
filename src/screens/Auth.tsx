import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell, Mail, Apple, Chrome } from 'lucide-react'; // Fallback icons for providers

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    if (isOtpSent) {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Check your email for the login code, or enter it below!');
        setIsOtpSent(true);
      }
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setMessage(error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple/10 mb-2">
            <Dumbbell className="w-6 h-6 text-purple" />
          </div>
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Physique AI</h1>
          <p className="text-[14px] text-text-secondary">Sign in to your account</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-background-secondary border border-border-secondary rounded-md text-[14px] font-medium text-text-primary hover:bg-border-tertiary transition-colors"
          >
            <Chrome className="w-4 h-4" /> Continue with Google
          </button>
          
          <button 
            onClick={() => handleOAuthLogin('apple')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-text-primary text-background-primary rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Apple className="w-4 h-4" /> Continue with Apple
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-tertiary" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background-primary px-2 text-text-tertiary">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isOtpSent || loading}
              className="w-full px-3 py-2.5 border-[0.5px] border-border-secondary bg-background-secondary text-text-primary rounded-md focus:outline-none focus:border-purple text-[14px]"
              required
            />
            {isOtpSent && (
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 border-[0.5px] border-border-secondary bg-background-secondary text-text-primary rounded-md focus:outline-none focus:border-purple text-[14px]"
                required
              />
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 p-3 bg-purple text-background-primary rounded-md text-[14px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isOtpSent ? 'Verify Code' : 'Send OTP')}
            </button>
          </form>

          {message && (
            <p className="text-center text-[12px] text-text-secondary pt-2">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
