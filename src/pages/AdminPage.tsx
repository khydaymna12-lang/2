import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { candidateService } from '../services/candidateService';
import { resultService } from '../services/resultService';
import { settingService } from '../services/settingService';
import { materialService } from '../services/materialService';
import { aiService } from '../services/aiService';
import { 
  Users, CheckSquare, Clock, BarChart3, Search, Filter, Play, 
  Settings, Save, Sparkles, ChevronRight, X, AlertCircle, Edit, Trash, HelpCircle, Key, Lock, Unlock, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, TestResult, TestSettings, TestMaterial } from '../types';

interface AdminPageProps {
  onExit: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onExit }) => {
  const { t } = useLanguage();
  
  // Auth wall
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data registries
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [settings, setSettings] = useState<TestSettings | null>(null);
  const [material, setMaterial] = useState<TestMaterial | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Selected candidate review states
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isAiGradingActive, setIsAiGradingActive] = useState(false);
  const [overrideCEFR, setOverrideCEFR] = useState('B2');
  const [overrideFeedback, setOverrideFeedback] = useState('');

  // Tab switching
  const [activeTab, setActiveTab] = useState<'candidates' | 'materials' | 'settings'>('candidates');

  // Check if admin is already logged in
  useEffect(() => {
    const checkExistingAdmin = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setIsAdminAuthenticated(true);
      }
    };
    checkExistingAdmin();
  }, []);

  // Load Admin Data once authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [loadedCandidates, loadedResults, loadedSettings, loadedMaterial] = await Promise.all([
          candidateService.getAllCandidates(),
          resultService.getAllResults(),
          settingService.getSettings(),
          materialService.getTestMaterial()
        ]);

        setCandidates(loadedCandidates);
        setResults(loadedResults);
        setSettings(loadedSettings);
        setMaterial(loadedMaterial);
      } catch (err) {
        console.error("Error loading administration stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [isAdminAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const profile = await authService.loginUser(email, password);
      if (profile.role === 'admin') {
        setIsAdminAuthenticated(true);
      } else {
        setAuthError('Access Denied: The account is not an administrator.');
        await authService.logout();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect administrator credentials.');
    }
  };

  const handleToggleLock = async (candidate: UserProfile) => {
    const newLockState = !candidate.isLocked;
    try {
      await candidateService.updateProfile(candidate.uid, { isLocked: newLockState });
      setCandidates(prev => prev.map(c => c.uid === candidate.uid ? { ...c, isLocked: newLockState } : c));
    } catch (err) {
      console.error(err);
      alert('Failed to update lock status.');
    }
  };

  const handleResetAttempt = async (candidate: UserProfile) => {
    if (!window.confirm(`Are you sure you want to reset candidate ${candidate.name}'s attempt? This will permanently delete their progress and results so they can take the test again.`)) {
      return;
    }
    try {
      await resultService.resetCandidateAttempt(candidate.uid);
      setCandidates(prev => prev.map(c => c.uid === candidate.uid ? { ...c, examSubmitted: false } : c));
      setResults(prev => prev.filter(r => r.candidateId !== candidate.uid));
      if (selectedResult?.candidateId === candidate.uid) {
        setSelectedResult(null);
      }
      alert('Candidate attempt reset successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset attempt.');
    }
  };

  // Run AI analysis manually
  const triggerManualAiEvaluation = async (resItem: TestResult) => {
    setIsAiGradingActive(true);
    try {
      const evaluation = await aiService.evaluateSubmission(
        resItem.writing.essayAnswer || '',
        resItem.speaking.speakingAudioUrl || ''
      );

      const updatedResult: TestResult = {
        ...resItem,
        writing: {
          ...resItem.writing,
          score: evaluation.writing.taskAchievement.score,
          band: evaluation.writing.cefrLevel,
          feedback: evaluation.writing.feedback,
          aiEvaluation: evaluation.writing
        },
        speaking: {
          ...resItem.speaking,
          score: evaluation.speaking.pronunciation.score,
          band: evaluation.speaking.cefrLevel,
          feedback: evaluation.speaking.feedback,
          aiEvaluation: evaluation.speaking
        },
        overallCEFR: evaluation.overallCEFR,
        status: 'completed',
        gradedBy: 'ai'
      };

      await resultService.saveResult(updatedResult);
      setResults(prev => prev.map(r => r.id === resItem.id ? updatedResult : r));
      setSelectedResult(updatedResult);
    } catch (e) {
      console.error("AI grading failed:", e);
    } finally {
      setIsAiGradingActive(false);
    }
  };

  const handleManualOverrideSave = async () => {
    if (!selectedResult) return;
    const updated: TestResult = {
      ...selectedResult,
      overallCEFR: overrideCEFR,
      status: 'completed',
      gradedBy: 'admin',
      writing: {
        ...selectedResult.writing,
        feedback: overrideFeedback || selectedResult.writing.feedback
      }
    };

    try {
      await resultService.saveResult(updated);
      setResults(prev => prev.map(r => r.id === selectedResult.id ? updated : r));
      setSelectedResult(updated);
      alert('Candidate evaluation updated and finalized successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMaterial = async () => {
    if (!material) return;
    try {
      await materialService.saveTestMaterial(material);
      alert('Test materials successfully synchronized to database.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await settingService.saveSettings(settings);
      alert('Global test settings successfully synchronized.');
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for KPI Cards
  const totalCompleted = results.filter(r => r.status === 'completed').length;
  const totalPending = results.filter(r => r.status === 'pending').length;
  const mcqScores = results.map(r => {
    const listenScore = r.listening?.score || 0;
    const readScore = r.reading?.score || 0;
    return ((listenScore + readScore) / 12) * 100;
  });
  const avgMcqScore = mcqScores.length > 0 ? Math.round(mcqScores.reduce((a, b) => a + b, 0) / mcqScores.length) : 0;

  // Filter Logic for Candidates list
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (c.phone && c.phone.includes(searchQuery));
    
    if (statusFilter === 'all') return matchesSearch;
    
    const result = results.find(r => r.candidateId === c.uid);
    if (statusFilter === 'completed') {
      return matchesSearch && result && result.status === 'completed';
    }
    if (statusFilter === 'pending') {
      return matchesSearch && result && result.status === 'pending';
    }
    return matchesSearch;
  });

  // Access Wall render
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200/60 shadow-xl flex flex-col gap-6"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-150">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">Admin Gatekeeper</h2>
            <p className="text-xs text-slate-500 max-w-xs">
              This space requires management verification. Enter the supervisor email and password to access candidate papers.
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            {authError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
                {authError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 transition-all"
            >
              Authenticate Portal
            </button>
          </form>

          <button 
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-slate-600 text-center font-semibold"
          >
            Return to Candidate Panel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              EP
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">{t('admin.dashboardTitle')}</h2>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Secure Supervisor Panel</span>
            </div>
          </div>

          {/* Supervisor navigation tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">
            <button 
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'candidates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Candidates</span>
            </button>
            <button 
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'materials' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Placement Materials</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Global Config</span>
            </button>
          </div>

          <button 
            onClick={onExit}
            className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
          >
            Exit Admin Panel
          </button>
        </div>
      </header>

      {/* Primary Supervisor Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6 font-sans">
        
        {/* TAB 1: CANDIDATES LOG & MANAGEMENT */}
        {activeTab === 'candidates' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* KPI Cards Bento Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center gap-4 hover:border-blue-300 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Users</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{candidates.length}</span>
                </div>
              </div>
 
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('admin.completedTests')}</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{totalCompleted}</span>
                </div>
              </div>
 
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center gap-4 hover:border-amber-300 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('admin.pendingGrading')}</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{totalPending}</span>
                </div>
              </div>
 
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center gap-4 hover:border-purple-300 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('admin.avgScore')}</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{avgMcqScore}%</span>
                </div>
              </div>
            </div>
 
            {/* Split layout: List on Left, Diagnostic meta details on Right */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
              
              {/* Left Bento: Candidate registry table container */}
              <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between">
                
                <div>
                  {/* Query & Filter parameters */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                      <input
                        type="text"
                        placeholder={t('admin.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-slate-700 transition font-semibold"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                      <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none font-bold"
                      >
                        <option value="all">{t('admin.allStatus')}</option>
                        <option value="completed">{t('admin.statusCompleted')}</option>
                        <option value="pending">{t('admin.statusPending')}</option>
                      </select>
                    </div>

                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-3 px-5">Candidate Details</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5">{t('admin.scoreColumn')}</th>
                          <th className="py-3 px-5">{t('admin.levelColumn')}</th>
                          <th className="py-3 px-5">{t('admin.dateColumn')}</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-medium">
                              No registered placement files match criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map(cand => {
                            const result = results.find(r => r.candidateId === cand.uid);
                            const hasSubmitted = cand.examSubmitted || !!result;
                            return (
                              <tr key={cand.uid} className={`border-b border-slate-100 hover:bg-slate-50/30 transition text-xs font-semibold text-slate-600 ${cand.isLocked ? 'bg-rose-50/10' : ''}`}>
                                <td className="py-3.5 px-5">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-950 text-sm tracking-tight flex items-center gap-1.5">
                                      {cand.name}
                                      {cand.isLocked && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-700 uppercase border border-rose-200 animate-pulse">
                                          <Lock className="h-2 w-2" /> Locked
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-slate-400 text-[11px] mt-0.5">
                                      {cand.phone} {cand.email ? `• ${cand.email}` : ''}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5">
                                  {cand.isLocked ? (
                                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold uppercase tracking-wide border border-rose-100/50">
                                      Blocked
                                    </span>
                                  ) : result ? (
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${
                                      result.status === 'completed' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                                        : 'bg-amber-50 text-amber-600 border-amber-100/50'
                                    }`}>
                                      {result.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>
                                  ) : hasSubmitted ? (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold uppercase tracking-wide border border-blue-100/50">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-bold uppercase tracking-wide border border-slate-200/50">
                                      No Attempt
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-5 font-mono text-slate-800">
                                  {result ? `${(result.listening?.score || 0) + (result.reading?.score || 0)} / 12` : '-'}
                                </td>
                                <td className="py-3.5 px-5">
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold uppercase tracking-wide border border-blue-100/50">
                                    {result ? result.overallCEFR : cand.targetLevel || '-'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-slate-400 text-[11px]">
                                  {new Date(cand.createdAt || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Lock/Unlock Toggle */}
                                    <button
                                      onClick={() => handleToggleLock(cand)}
                                      title={cand.isLocked ? 'Unlock Candidate' : 'Lock Candidate'}
                                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                        cand.isLocked 
                                          ? 'border-emerald-200 hover:bg-emerald-50 text-emerald-600' 
                                          : 'border-rose-200 hover:bg-rose-50 text-rose-600'
                                      }`}
                                    >
                                      {cand.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                    </button>

                                    {/* Reset Attempt */}
                                    {hasSubmitted && (
                                      <button
                                        onClick={() => handleResetAttempt(cand)}
                                        title="Reset Attempt"
                                        className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 transition cursor-pointer"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {/* Review Submission */}
                                    {result && (
                                      <button
                                        onClick={() => {
                                          setSelectedResult(result);
                                          setOverrideCEFR(result.overallCEFR);
                                          setOverrideFeedback(result.writing.feedback || '');
                                        }}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer"
                                      >
                                        Review
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                  Showing {filteredCandidates.length} candidate profiles.
                </div>

              </div>

              {/* Right Bento: Supervisor Quick Actions Card */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden min-h-[350px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Operational Context</span>
                  <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
                    <span>Evaluation Guard</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-3">
                    As supervisor, you hold structural override powers. Oral and essay benchmarks evaluated by Gemini AI can be dynamically fine-tuned or verified manually.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4.5 rounded-2xl border border-slate-700/60 z-10 flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-400" /> System Diagnostics
                  </h4>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span>Firestore Sync:</span>
                      <span className="text-emerald-400 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gemini Evaluation:</span>
                      <span className="text-blue-400 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Access:</span>
                      <span className="text-emerald-400 font-bold">Granted</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Secure administration session bound to candidate placement benchmarks.
                </p>

                <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/6">
                  <Users className="h-56 w-56 text-white" />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PLACEMENT MATERIALS EDITOR */}
        {activeTab === 'materials' && material && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-950">{t('admin.testMaterialsTitle')}</h3>
                <p className="text-xs text-slate-500">Alter reading passages, audio guides, or prompts instantly.</p>
              </div>
              <button 
                onClick={handleSaveMaterial}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save Materials
              </button>
            </div>

            <div className="flex flex-col gap-5 max-w-4xl">
              {/* Listening Audio Link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.audioLink')}</label>
                <input
                  type="text"
                  value={material.listeningAudioUrl}
                  onChange={(e) => setMaterial({ ...material, listeningAudioUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none text-slate-800 transition"
                />
              </div>

              {/* Essay Prompt */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Writing Essay Prompt</label>
                <textarea
                  value={material.writingPrompt}
                  onChange={(e) => setMaterial({ ...material, writingPrompt: e.target.value })}
                  className="w-full min-h-[100px] bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-3 text-xs font-semibold outline-none text-slate-800 transition"
                />
              </div>

              {/* Speaking Prompt */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speaking Prompt Card Cues</label>
                <textarea
                  value={material.speakingPrompt}
                  onChange={(e) => setMaterial({ ...material, speakingPrompt: e.target.value })}
                  className="w-full min-h-[120px] bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-3 text-xs font-semibold outline-none text-slate-800 transition whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL CONFIGURATIONS */}
        {activeTab === 'settings' && settings && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-950">{t('admin.systemSettings')}</h3>
                <p className="text-xs text-slate-500">Configure core timers, targets, and operational flags.</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save Config
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.testDurationLabel')}</label>
                <input
                  type="number"
                  value={settings.testDuration}
                  onChange={(e) => setSettings({ ...settings, testDuration: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none text-slate-800 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.passingScoreLabel')}</label>
                <input
                  type="number"
                  value={settings.passingScore}
                  onChange={(e) => setSettings({ ...settings, passingScore: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none text-slate-800 transition"
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* DETAILED CANDIDATE REVIEW MODAL SLIDEOVER */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-base text-slate-950">{t('admin.reviewCandidate')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Candidate: {selectedResult.candidateName}</p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content Scroll */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
                
                {/* AI Grader Banner */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest">Interactive AI Assessor</h4>
                      <p className="text-[11px] text-blue-800 mt-1">Let Gemini 2.5 evaluate, grade spelling metrics, transcription and CEFR bands.</p>
                    </div>
                  </div>

                  <button
                    disabled={isAiGradingActive}
                    onClick={() => triggerManualAiEvaluation(selectedResult)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-100 transition"
                  >
                    {isAiGradingActive ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Grading...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('admin.aiGradingAction')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Score breakdown parameters */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Communication Skill Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Listening MCQ:</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{selectedResult.listening?.score} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Reading MCQ:</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{selectedResult.reading?.score} / 7</span>
                    </div>
                  </div>
                </div>

                {/* Essay answers view */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">{t('admin.writingAnswer')}</h4>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto pr-1">
                    {selectedResult.writing?.essayAnswer || "No essay drafted."}
                  </div>
                </div>

                {/* Speaking audio view */}
                {selectedResult.speaking?.speakingAudioUrl && (
                  <div className="flex flex-col gap-2">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">{t('admin.speakingPlayback')}</h4>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <audio src={selectedResult.speaking.speakingAudioUrl} controls className="w-full h-10 outline-none" />
                    </div>
                  </div>
                )}

                {/* Override settings form */}
                <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">{t('admin.manualGradeOverride')}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CEFR Rating</label>
                      <select
                        value={overrideCEFR}
                        onChange={(e) => setOverrideCEFR(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option value="A1">A1 (Beginner)</option>
                        <option value="A2">A2 (Elementary)</option>
                        <option value="B1">B1 (Intermediate)</option>
                        <option value="B2">B2 (Upper-Int)</option>
                        <option value="C1">C1 (Advanced)</option>
                        <option value="C2">C2 (Proficient)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supervisor Evaluation Remarks</label>
                    <textarea
                      value={overrideFeedback}
                      onChange={(e) => setOverrideFeedback(e.target.value)}
                      placeholder="Input feedback regarding candidate communication ranges..."
                      className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none text-slate-800 transition"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Close details
                </button>
                <button
                  onClick={handleManualOverrideSave}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-150 transition"
                >
                  {t('admin.submitGrades')}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-xs text-slate-400 font-medium">
        Supervisor Station &copy; 2026 EPTest Platform. All rights reserved.
      </footer>
    </div>
  );
};
export default AdminPage;
