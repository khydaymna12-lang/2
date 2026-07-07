import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { BookOpen, User, Mail, Phone, Target, Compass, Sparkles, CheckSquare } from 'lucide-react';
import { authService } from '../services/authService';

interface OnboardingPageProps {
  onRegisterSuccess: (userProfile: any) => void;
  onCancel: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onRegisterSuccess, onCancel }) => {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [targetLevel, setTargetLevel] = useState('B2');
  const [estimateLevel, setEstimateLevel] = useState('B1');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Name and Phone Number are strictly required.');
      return;
    }
    if (!agree) {
      setError('You must agree to complete the assessment independently.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const profile = await authService.studentLogin(
        name,
        phone,
        {
          email,
          targetScore,
          targetLevel,
          estimateLevel
        }
      );
      onRegisterSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during account setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 md:p-10 font-sans">
      
      {/* Upper Navigation Back Button */}
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            EP
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">{t('common.appName')}</span>
        </div>
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-xs text-slate-600 font-bold rounded-xl border border-slate-200 shadow-xs cursor-pointer transition"
        >
          {t('common.back')}
        </button>
      </div>

      {/* Main Bento Layout */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* Left Column: Welcome & Info Cards */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
          
          {/* Card A: Welcome & Vision (Blue) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden"
          >
            <div className="z-10">
              <div className="inline-flex items-center gap-1 bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="h-3 w-3" /> Candidate Gate
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {t('onboarding.welcome')}
              </h2>
              <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed mt-3">
                {t('onboarding.instructionsText')}
              </p>
            </div>
            
            <p className="text-[10px] text-blue-200/80 font-medium z-10">
              Accurate diagnostics powered by official CEFR benchmarks and advanced AI grading algorithms.
            </p>

            <div className="absolute right-0 bottom-0 opacity-[0.05] pointer-events-none transform translate-x-1/6 translate-y-1/6">
              <Compass className="h-64 w-64" />
            </div>
          </motion.div>

          {/* Card B: Modules List */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exam Structures</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                <div className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">L</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('onboarding.listeningTitle')}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{t('onboarding.listeningText')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                <div className="h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">R</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('onboarding.readingTitle')}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{t('onboarding.readingText')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                <div className="h-6 w-6 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">W</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('onboarding.writingTitle')}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{t('onboarding.writingText')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                <div className="h-6 w-6 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs shrink-0">S</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('onboarding.speakingTitle')}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{t('onboarding.speakingText')}</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Profile Setup Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="col-span-12 md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-slate-100 pb-3 mb-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interactive Setup</p>
              <h3 className="text-lg font-bold text-slate-900">Setup Placement Profile</h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-rose-50 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl border border-rose-100">
                  {error}
                </div>
              )}

              {/* Name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.name')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.email')} (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    placeholder="johndoe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Phone input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    required
                    placeholder="+84 901 234 567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Target & Estimate Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('onboarding.targetLevel')}</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150 cursor-pointer"
                  >
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper-Int)</option>
                    <option value="C1">C1 (Advanced)</option>
                    <option value="C2">C2 (Proficient)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('onboarding.estimateLevel')}</label>
                  <select
                    value={estimateLevel}
                    onChange={(e) => setEstimateLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150 cursor-pointer"
                  >
                    <option value="A1">A1 (Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper-Int)</option>
                    <option value="C1">C1 (Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Target score (optional) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('onboarding.targetScore')}</label>
                <div className="relative">
                  <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="e.g., IELTS 6.5"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Independent cert check box */}
              <div className="flex items-start gap-2.5 mt-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300 cursor-pointer"
                />
                <label htmlFor="agree" className="text-xs text-slate-500 leading-relaxed select-none cursor-pointer">
                  {t('onboarding.agreeCheck')}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all duration-300 cursor-pointer text-sm ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? t('common.loading') : t('onboarding.startTestBtn')}
              </button>
            </form>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-6">
            By registering, you agree to complete the diagnostics independently without third-party assistance.
          </p>
        </motion.div>

      </main>
    </div>
  );
};
export default OnboardingPage;
