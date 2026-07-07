import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  BookOpen, Award, Sparkles, Shield, ChevronRight, UserCheck, 
  Play, Download, Lock, Phone, User, CheckCircle2, AlertTriangle, 
  PlayCircle, FileDown, Mail, Home, Info, X, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/authService';

interface LandingPageProps {
  onStart: () => void;
  onAdminLogin: () => void;
  user: any;
  onGoToResults: () => void;
  hasResult: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStart, 
  onAdminLogin, 
  user, 
  onGoToResults,
  hasResult 
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'home' | 'exams' | 'materials' | 'results' | 'contact'>('home');
  
  // Login / registration modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [targetLevel, setTargetLevel] = useState('B2');
  const [estimateLevel, setEstimateLevel] = useState('B1');
  const [targetScore, setTargetScore] = useState('');
  const [agree, setAgree] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video and download interactions
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Custom static content for Study Materials
  const videos = [
    {
      id: 'v1',
      title: {
        en: 'Mastering CEFR B2/C1 Grammar & Sentence Structure',
        vi: 'Làm Chủ Ngữ Pháp & Cấu Trúc Câu CEFR B2/C1'
      },
      duration: '18 mins',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=60',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      id: 'v2',
      title: {
        en: 'Listening Strategies: Spotting Distractors in Academic Audio',
        vi: 'Chiến Thuật Nghe: Bẫy Thông Tin Gây Nhiễu'
      },
      duration: '12 mins',
      thumbnail: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?w=400&auto=format&fit=crop&q=60',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4'
    },
    {
      id: 'v3',
      title: {
        en: 'Writing Excellence: Structuring High-Scoring Essays',
        vi: 'Bí Quyết Viết: Bố Cục Bài Luận Điểm Cao'
      },
      duration: '15 mins',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&auto=format&fit=crop&q=60',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  ];

  const downloads = [
    {
      id: 'd1',
      title: {
        en: 'Complete CEFR Vocabulary Guide & Practice Exercises',
        vi: 'Cẩm Nang Từ Vựng CEFR Toàn Diện & Bài Tập Thực Hành'
      },
      type: 'PDF Guide',
      size: '4.8 MB',
      filename: 'CEFR_Vocabulary_Guide.pdf'
    },
    {
      id: 'd2',
      title: {
        en: 'Speaking Section Templates and Mock Prompt Outlines',
        vi: 'Mẫu Trả Lời Nói & Dàn Ý Chủ Đề Thực Tế'
      },
      type: 'PDF Prep Pack',
      size: '3.2 MB',
      filename: 'Speaking_Templates_Pack.pdf'
    }
  ];

  // Helper to run action or enforce login
  const handleProtectedAction = (action: () => void, reasonKey: string) => {
    if (!user) {
      setLoginReason(reasonKey);
      setLoginError('');
      setIsLoginModalOpen(true);
    } else {
      action();
    }
  };

  // Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim()) {
      setLoginError(language === 'en' ? 'Full Name and Phone are required.' : 'Họ tên và Số điện thoại là bắt buộc.');
      return;
    }
    if (!agree) {
      setLoginError(language === 'en' ? 'You must accept the honor code.' : 'Bạn phải cam kết làm bài độc lập.');
      return;
    }

    setLoginError('');
    setIsSubmitting(true);
    try {
      await authService.studentLogin(
        nameInput.trim(),
        phoneInput.trim(),
        {
          email: emailInput.trim(),
          targetLevel,
          estimateLevel,
          targetScore: targetScore.trim()
        }
      );
      setIsLoginModalOpen(false);
      // Clean inputs
      setNameInput('');
      setPhoneInput('');
      setEmailInput('');
      setTargetScore('');
    } catch (err: any) {
      setLoginError(err.message || 'Error configuring student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF Material Download
  const handleDownload = (filename: string) => {
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4000);
    // Open a dummy download frame/link
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contact form submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Upper Navigation Rail */}
      <header className="max-w-7xl w-full mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm mt-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-100">
            EP
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-900 tracking-tight leading-none">{t('common.appName')}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">Student Academy Hub</span>
          </div>
        </div>

        {/* Sections Selection Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
          <button 
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'home' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{language === 'en' ? 'Home' : 'Trang Chủ'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'exams' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Exams' : 'Kỳ Thi'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'materials' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Study Materials' : 'Tài Liệu'}</span>
          </button>
          <button 
            onClick={() => {
              handleProtectedAction(() => {
                if (hasResult) {
                  onGoToResults();
                } else {
                  setActiveTab('results');
                }
              }, 'viewing results');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'results' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Results' : 'Kết Quả'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'contact' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Contact' : 'Liên Hệ'}</span>
          </button>
        </nav>
        
        <div className="flex items-center gap-3">
          {/* Custom language picker (Language Switch) */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/40">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'en' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'vi' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VI
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' ? (
                <button 
                  onClick={onAdminLogin}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition"
                >
                  Admin Panel
                </button>
              ) : null}
              <button 
                onClick={() => authService.logout()}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer transition"
              >
                {t('common.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleProtectedAction(() => {}, 'taking exams')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
              >
                {language === 'en' ? 'Log In' : 'Đăng Nhập'}
              </button>
              <button 
                onClick={onAdminLogin}
                className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold transition px-2"
              >
                Admin
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Tab Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col gap-6">
        
        {/* DOWNLOAD SUCCESS ALERT */}
        <AnimatePresence>
          {downloadSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                {language === 'en' 
                  ? `Successfully downloaded ${downloadSuccess}` 
                  : `Đã tải xuống thành công tài liệu: ${downloadSuccess}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-12 gap-6 items-stretch">
            
            {/* Main Stage Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm border-l-4 border-l-blue-600 flex flex-col justify-between gap-6 min-h-[350px] relative overflow-hidden"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 text-xs font-semibold w-fit mb-4">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>AI-Powered Linguistic Diagnostics</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                  {t('common.title')}
                </h1>

                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                  {t('common.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 z-10">
                {user ? (
                  hasResult ? (
                    <button 
                      onClick={onGoToResults}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>View Results Card</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (user.isLocked) {
                          alert(language === 'en' ? 'Your candidate profile is locked. Contact your supervisor.' : 'Hồ sơ của bạn đã bị khóa. Vui lòng liên hệ giám thị.');
                        } else {
                          onStart();
                        }
                      }}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>{t('onboarding.startTestBtn')}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => handleProtectedAction(() => {}, 'taking exams')}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer animate-pulse"
                  >
                    <span>{language === 'en' ? 'Register / Sign In to Start' : 'Đăng Ký / Đăng Nhập Để Bắt Đầu'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('materials')}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold rounded-xl transition-all text-center flex items-center justify-center text-sm cursor-pointer"
                >
                  {language === 'en' ? 'Explore Prep Materials' : 'Khám phá tài liệu ôn tập'}
                </button>
              </div>

              <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 translate-y-1/4">
                <BookOpen className="h-96 w-96 text-blue-600" />
              </div>
            </motion.div>

            {/* STUDENT DASHBOARD SIDEBAR CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              {user ? (
                <div className="flex flex-col h-full justify-between gap-6">
                  {/* Dashboard Header */}
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {language === 'en' ? 'Student Dashboard' : 'Bảng Điều Khiển'}
                        </h2>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        user.isLocked 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {user.isLocked 
                          ? (language === 'en' ? 'LOCKED' : 'ĐÃ KHÓA') 
                          : (language === 'en' ? 'ACTIVE' : 'HOẠT ĐỘNG')}
                      </span>
                    </div>

                    {/* Candidate Identity Details */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {language === 'en' ? 'Candidate Name' : 'Họ và Tên'}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800">{user.name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {language === 'en' ? 'Phone Number' : 'Số Điện Thoại'}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 font-mono">{user.phone || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {language === 'en' ? 'Email Address' : 'Địa chỉ Email'}
                        </span>
                        <span className="text-xs font-medium text-slate-500 break-all">{user.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-200/50 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Target CEFR</span>
                          <span className="text-xs font-bold text-blue-600">{user.targetLevel || 'B2'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Est. Level</span>
                          <span className="text-xs font-bold text-slate-600">{user.estimateLevel || 'B1'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Exam History Block */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 mb-2">
                        {language === 'en' ? 'Exam History' : 'Lịch Sử Thi'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <span className="font-semibold text-slate-700">Core English Placement</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            hasResult || user.examSubmitted 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {hasResult || user.examSubmitted 
                              ? (language === 'en' ? 'Completed' : 'Đã Hoàn Thành') 
                              : (language === 'en' ? 'Available' : 'Chưa Làm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.isLocked && (
                    <div className="bg-rose-50 text-rose-700 text-xs p-3.5 rounded-2xl border border-rose-100 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-semibold">
                        {language === 'en' 
                          ? 'Your candidate profile is locked. Please contact your supervisor immediately.' 
                          : 'Hồ sơ thí sinh đã bị khóa. Vui lòng liên hệ với giám thị ngay lập tức.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-center p-6 gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {language === 'en' ? 'Student Dashboard' : 'Bảng Điều Khiển'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {language === 'en' 
                        ? 'Register or log in with your Name & Phone to see your diagnostics scorecard, available exams, and tracking analytics.' 
                        : 'Vui lòng đăng ký hoặc đăng nhập với Họ tên & Số điện thoại để theo dõi hồ sơ thi, điểm CEFR và tài liệu ôn tập.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleProtectedAction(() => {}, 'taking exams')}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition text-xs cursor-pointer"
                  >
                    {language === 'en' ? 'Set Up Candidate Profile' : 'Thiết Lập Hồ Sơ Thí Sinh'}
                  </button>
                </div>
              )}
            </motion.div>

            {/* How it works breakdown */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
            >
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Process Map</p>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">How Our Platform Works</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2">
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition duration-300">
                    <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-100">1</div>
                    <h4 className="font-bold text-slate-800 text-xs">Register Profile</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">Enter credentials and state target proficiency targets.</p>
                  </div>

                  <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition duration-300">
                    <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100">2</div>
                    <h4 className="font-bold text-slate-800 text-xs">Complete Exam</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">Take the exam under mild timed intervals, covering all modules.</p>
                  </div>

                  <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition duration-300">
                    <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xs border border-emerald-100">3</div>
                    <h4 className="font-bold text-slate-800 text-xs">AI Evaluation</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">View mapped CEFR levels, grammar logs, and custom feedback sheets.</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        )}

        {/* 2. EXAMS TAB */}
        {activeTab === 'exams' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto w-full flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'en' ? 'Available Placement Examinations' : 'Các Kỳ Thi Xếp Lớp Có Sẵn'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en' 
                  ? 'Complete standardized evaluations under timed limits to generate your CEFR-aligned scorecard.' 
                  : 'Hoàn thành các bài đánh giá tiêu chuẩn có giới hạn thời gian để nhận bảng điểm CEFR tương ứng.'}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Award className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Core English Placement Exam
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>45 {language === 'en' ? 'Minutes' : 'Phút'}</span>
                    <span>•</span>
                    <span>4 {language === 'en' ? 'Modules' : 'Phần Thi'}</span>
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2.5">
                {user ? (
                  user.isLocked ? (
                    <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      {language === 'en' ? 'LOCKED/SUSPENDED' : 'BỊ KHÓA'}
                    </span>
                  ) : hasResult || user.examSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {language === 'en' ? 'SUBMITTED' : 'ĐÃ NỘP BÀI'}
                      </span>
                      <button 
                        onClick={onGoToResults}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        {language === 'en' ? 'Review Report' : 'Xem Báo Cáo'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={onStart}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-100 transition cursor-pointer"
                    >
                      {language === 'en' ? 'Begin Assessment' : 'Bắt Đầu Làm Bài'}
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => handleProtectedAction(onStart, 'taking exams')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-100 transition cursor-pointer"
                  >
                    {language === 'en' ? 'Log In & Take Exam' : 'Đăng Nhập & Làm Bài'}
                  </button>
                )}
              </div>
            </div>

            {/* Locked warning info */}
            {user?.isLocked && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs leading-relaxed flex gap-2.5">
                <Lock className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
                <p>
                  {language === 'en' 
                    ? 'Your account has been locked from taking tests. This occurs when a supervisor suspends your access or suspects external generative help. Please report to the administrative office.' 
                    : 'Hồ sơ của bạn đã bị khóa làm bài thi. Điều này xảy ra khi giám thị phát hiện gian lận hoặc treo tài khoản của bạn. Vui lòng liên hệ với văn phòng để mở khóa.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. STUDY MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900">
                {language === 'en' ? 'Linguistic Resource Hub' : 'Kho Tài Liệu Ôn Tập'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                {language === 'en' 
                  ? 'Access high-quality exam preparations, specialized video courses, and structured grammar PDF guides.' 
                  : 'Truy cập các video bài giảng chất lượng cao, các cẩm nang tự ôn tập và bài tập rèn luyện ngữ pháp chuyên sâu.'}
              </p>
              {!user && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-medium rounded-xl flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    {language === 'en' 
                      ? 'Note: Students must login before watching videos and downloading materials.' 
                      : 'Lưu ý: Học viên bắt buộc phải đăng nhập trước khi xem bài giảng video hoặc tải tài liệu ôn tập.'}
                  </span>
                </div>
              )}
            </div>

            {/* Video Lectures Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PlayCircle className="h-4.5 w-4.5 text-blue-600" />
                <span>{language === 'en' ? 'Video Masterclasses' : 'Bản Tin & Bài Giảng Video'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {videos.map((vid) => (
                  <div key={vid.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative">
                      <img 
                        src={vid.thumbnail} 
                        alt="Video Cover" 
                        className="w-full h-36 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <button 
                          onClick={() => handleProtectedAction(() => setPlayingVideo(vid), 'watching videos')}
                          className="h-12 w-12 rounded-full bg-white text-blue-600 hover:scale-110 shadow-lg flex items-center justify-center transition cursor-pointer"
                        >
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {language === 'en' ? vid.title.en : vid.title.vi}
                      </h4>
                      
                      <div className="flex items-center justify-between mt-1 border-t border-slate-50 pt-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Pre-Recorded</span>
                        {!user && (
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Login to Watch
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downloadable Guides Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileDown className="h-4.5 w-4.5 text-blue-600" />
                <span>{language === 'en' ? 'Academic Study Sheets (PDF)' : 'Tài Liệu Đọc & Đề Cương (PDF)'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {downloads.map((docItem) => (
                  <div key={docItem.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-normal">
                          {language === 'en' ? docItem.title.en : docItem.title.vi}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                          {docItem.type} • {docItem.size}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleProtectedAction(() => handleDownload(docItem.filename), 'downloading materials')}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 flex items-center gap-1 shrink-0 cursor-pointer transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Download' : 'Tải Về'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. RESULTS TAB (RESTRICTED STATE) */}
        {activeTab === 'results' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-md mx-auto w-full text-center flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UserCheck className="h-6 w-6" />
            </div>
            
            {user ? (
              <div className="flex flex-col gap-3">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {language === 'en' ? 'No Exam Results Found' : 'Chưa Có Kết Quả Đánh Giá'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'en' 
                    ? 'You have not submitted a placement exam attempt yet. Complete the 4-module evaluation to view CEFR and NLP grading.' 
                    : 'Bạn chưa hoàn thành bài thi xếp lớp tiếng Anh nào. Hãy làm bài đánh giá để sinh kết quả phân tích CEFR tự động.'}
                </p>
                <button 
                  onClick={() => setActiveTab('exams')}
                  className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition cursor-pointer text-xs"
                >
                  {language === 'en' ? 'Go to Exams' : 'Đến Trang Làm Bài'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {language === 'en' ? 'Login Required' : 'Yêu Cầu Đăng Nhập'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en' 
                    ? 'Linguistic results cards are secured. Please log in or set up a candidate profile first.' 
                    : 'Báo cáo điểm thi được bảo mật chặt chẽ. Vui lòng đăng nhập để xem thông tin kết quả thi.'}
                </p>
                <button 
                  onClick={() => handleProtectedAction(() => {}, 'viewing results')}
                  className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition cursor-pointer text-xs"
                >
                  {language === 'en' ? 'Log In to Access Results' : 'Đăng Nhập Để Xem Kết Quả'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto w-full flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>{language === 'en' ? 'Academic Advisory Support' : 'Liên Hệ Với Giám Khảo & Cố Vấn'}</span>
              </h2>
              <p className="text-xs text-slate-400 leading-normal mt-1">
                {language === 'en' 
                  ? 'Have a query about your CEFR placement results, locked account, or require a reset? File a request with our coordinators.' 
                  : 'Bạn có thắc mắc về kết quả thi, tài khoản bị khóa hoặc cần cấp lại lượt làm bài? Gửi yêu cầu tại đây.'}
              </p>
            </div>

            {contactSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-4 rounded-2xl border border-emerald-100 text-center flex flex-col items-center gap-2"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <h3 className="font-extrabold text-sm">{language === 'en' ? 'Message Sent Successfully' : 'Gửi Thư Thành Công'}</h3>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  {language === 'en' 
                    ? 'Thank you! Your academic ticket is successfully registered. An advisory advisor will reply within 24 hours.' 
                    : 'Cảm ơn bạn! Yêu cầu hỗ trợ học tập đã được gửi. Đội ngũ tư vấn sẽ phản hồi trong vòng 24 giờ.'}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Your Name' : 'Họ và Tên'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={user?.name || "John Doe"}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Email Address' : 'Địa chỉ Email'}
                    </label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder={user?.email || "johndoe@example.com"}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'en' ? 'Subject' : 'Tiêu Đề'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder={language === 'en' ? "Query about my test reset" : "Thắc mắc về reset bài thi"}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'en' ? 'Message' : 'Nội dung tin nhắn'}
                  </label>
                  <textarea 
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={language === 'en' ? "Type your academic or support message..." : "Nhập thắc mắc cần trợ giúp..."}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-100 transition cursor-pointer"
                >
                  {language === 'en' ? 'Send Advisory Message' : 'Gửi Thư Yêu Cầu'}
                </button>
              </form>
            )}
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center mt-8">
        <p className="text-xs text-slate-400 font-medium">
          &copy; 2026 EPTest Corporation. {t('common.appName')} - Designed with Academic Excellence.
        </p>
      </footer>

      {/* A. INTERACTIVE REGISTER / LOGIN MODAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {language === 'en' ? 'Candidate Access Required' : 'Yêu Cầu Truy Cập Thí Sinh'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {language === 'en' 
                      ? `Please sign in or configure your student account before ${loginReason}.` 
                      : `Vui lòng đăng ký hoặc đăng nhập tài học viên trước khi ${loginReason}.`}
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-xl mb-4">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('auth.name')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., John Doe"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('auth.phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g., +84 901 234 567"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('auth.email')} ({language === 'en' ? 'Optional' : 'Không bắt buộc'})</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input 
                      type="email" 
                      placeholder="e.g., john@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>

                {/* Target & Estimate Levels */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('onboarding.targetLevel')}</label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="A2">A2 (Elementary)</option>
                      <option value="B1">B1 (Intermediate)</option>
                      <option value="B2">B2 (Upper-Int)</option>
                      <option value="C1">C1 (Advanced)</option>
                      <option value="C2">C2 (Proficient)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('onboarding.estimateLevel')}</label>
                    <select
                      value={estimateLevel}
                      onChange={(e) => setEstimateLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="A1">A1 (Beginner)</option>
                      <option value="A2">A2 (Elementary)</option>
                      <option value="B1">B1 (Intermediate)</option>
                      <option value="B2">B2 (Upper-Int)</option>
                      <option value="C1">C1 (Advanced)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-2 select-none">
                  <input 
                    type="checkbox" 
                    id="modal-agree"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="modal-agree" className="text-[11px] text-slate-500 leading-normal cursor-pointer">
                    {t('onboarding.agreeCheck')}
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-blue-100 cursor-pointer mt-2"
                >
                  {isSubmitting ? t('common.loading') : (language === 'en' ? 'Register / Start Access' : 'Đăng Ký & Đăng Nhập')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. VIDEO MASTERCLASS POPUP PLAYER */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl overflow-hidden max-w-2xl w-full border border-slate-800 shadow-2xl relative"
            >
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute right-4 top-4 bg-slate-800/80 hover:bg-slate-800 p-1.5 rounded-full text-slate-300 hover:text-white transition cursor-pointer z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-video w-full bg-black relative">
                <video 
                  src={playingVideo.videoUrl} 
                  controls 
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              <div className="p-5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Masterclass Video Lesson</span>
                <h3 className="font-bold text-base text-white mt-1">
                  {language === 'en' ? playingVideo.title.en : playingVideo.title.vi}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {language === 'en' 
                    ? 'Watch this step-by-step masterclass block explaining typical CEFR testing strategies, standard vocabularies, and model answers.' 
                    : 'Xem bài giảng masterclass từng bước hướng dẫn các chiến lược thi CEFR, từ vựng tiêu chuẩn và bài giải mẫu.'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
