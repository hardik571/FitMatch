import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Zap, Globe, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: any) => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
  title: string;
  subtitle: string;
}

export default function Auth({ onSuccess, language, onToggleLanguage, title, subtitle }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    en: {
      login: 'Log In',
      signup: 'Sign Up',
      email: 'Email Address',
      password: 'Password',
      name: 'Full Name',
      submitLogin: 'Sign In to FitMatch',
      submitSignup: 'Create Account',
      switchSignup: "Don't have an account? Sign Up",
      switchLogin: "Already have an account? Log In",
      switchLang: 'हिंदी में बदलें',
      errorFill: 'Please fill in all fields'
    },
    hi: {
      login: 'लॉग इन',
      signup: 'साइन अप',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      name: 'पूरा नाम',
      submitLogin: 'साइन इन करें',
      submitSignup: 'खाता बनाएं',
      switchSignup: 'खाता नहीं है? साइन अप करें',
      switchLogin: 'पहले से खाता है? लॉग इन करें',
      switchLang: 'Switch to English',
      errorFill: 'कृपया सभी फ़ील्ड भरें'
    }
  };

  const txt = t[language];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || (!isLogin && !name)) {
      setError(txt.errorFill);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          // Pass the user up so App can handle the custom backend logic if needed
          onSuccess({ ...data.user, user_metadata: { ...data.user.user_metadata, name: data.user.user_metadata.name || email.split('@')[0] } });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            }
          }
        });
        if (error) throw error;
        if (data.user) {
           onSuccess({ ...data.user, user_metadata: { ...data.user.user_metadata, name } });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-md w-full animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
            <Zap className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h1>
          <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
        </div>

        <form onSubmit={handleAuth} className="glass p-8 rounded-3xl space-y-5 shadow-lg border border-white/60">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? txt.login : txt.signup}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm mb-4 flex items-start gap-3">
              <div className="mt-0.5"><Zap size={16} /></div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{txt.name}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/60 border border-black/5 rounded-2xl py-4 pl-11 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{txt.email}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/60 border border-black/5 rounded-2xl py-4 pl-11 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">{txt.password}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/60 border border-black/5 rounded-2xl py-4 pl-11 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg mt-8 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
            {isLogin ? txt.submitLogin : txt.submitSignup}
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-gray-500 text-sm font-bold hover:text-black transition-colors"
            >
              {isLogin ? txt.switchSignup : txt.switchLogin}
            </button>
          </div>
        </form>

        <div className="mt-8 flex justify-center gap-4">
          <button onClick={onToggleLanguage} className="glass px-6 py-3 rounded-full text-gray-600 text-sm font-bold hover:text-black transition-colors flex items-center gap-2 shadow-sm border border-black/5">
            <Globe size={18} />
            {txt.switchLang}
          </button>
        </div>
      </div>
    </div>
  );
}
