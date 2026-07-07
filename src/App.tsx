import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { authService } from './services/authService';
import { materialService } from './services/materialService';
import { settingService } from './services/settingService';
import { resultService } from './services/resultService';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import TestPage from './pages/TestPage';
import ResultsPage from './pages/ResultsPage';
import AdminPage from './pages/AdminPage';
import { UserProfile, TestMaterial, TestSettings, TestResult } from './types';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation & session state
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'onboarding' | 'test' | 'results' | 'admin'>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [testMaterial, setTestMaterial] = useState<TestMaterial | null>(null);
  const [settings, setSettings] = useState<TestSettings | null>(null);
  const [hasResult, setHasResult] = useState(false);
  
  const [initializing, setInitializing] = useState(true);
  const [loadingError, setLoadingError] = useState('');

  // 1. Subscribe to Authentication Changes & fetch configuration materials
  useEffect(() => {
    // Sync configurations
    const loadConfiguration = async () => {
      try {
        const [loadedMaterial, loadedSettings] = await Promise.all([
          materialService.getTestMaterial(),
          settingService.getSettings()
        ]);
        setTestMaterial(loadedMaterial);
        setSettings(loadedSettings);
      } catch (err: any) {
        console.error("Configuration load error:", err);
        setLoadingError('Failed to synchronize server configuration. Please reload.');
      }
    };
    loadConfiguration();

    // Listen to Firebase Auth state
    const unsubscribe = authService.subscribeToAuthChanges(async (profile) => {
      setUserProfile(profile);
      if (profile) {
        if (profile.role === 'admin') {
          // If admin, we don't necessarily have a candidate test result
          setHasResult(false);
        } else {
          // Check if candidate already has finished results
          const result = await resultService.getResultByCandidateId(profile.uid);
          setHasResult(!!result);
          if (result && currentRoute === 'landing') {
            setCurrentRoute('results');
          }
        }
      } else {
        setHasResult(false);
        if (currentRoute !== 'admin') {
          setCurrentRoute('landing');
        }
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [currentRoute]);

  const handleRegisterSuccess = async (profile: UserProfile) => {
    setUserProfile(profile);
    
    // Check if they already have results
    const result = await resultService.getResultByCandidateId(profile.uid);
    setHasResult(!!result);
    
    if (result) {
      setCurrentRoute('results');
    } else {
      setCurrentRoute('test');
    }
  };

  const handleTestSubmit = async (sessionId: string, finalAnswers: Record<string, string>, essayAnswer: string, speakingAudioUrl?: string) => {
    setHasResult(true);
    setCurrentRoute('results');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
          <h2 className="font-extrabold text-slate-800 text-base">Synchronizing Portal</h2>
          <p className="text-xs text-slate-400 font-medium max-w-xs">Connecting to secure linguistic diagnostic servers...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="font-sans antialiased bg-slate-50 min-h-screen text-slate-800">
        
        {currentRoute === 'landing' && (
          <LandingPage
            onStart={() => {
              if (userProfile && !hasResult) {
                setCurrentRoute('test');
              } else if (userProfile && hasResult) {
                setCurrentRoute('results');
              } else {
                setCurrentRoute('onboarding');
              }
            }}
            onAdminLogin={() => setCurrentRoute('admin')}
            user={userProfile}
            onGoToResults={() => setCurrentRoute('results')}
            hasResult={hasResult}
          />
        )}

        {currentRoute === 'onboarding' && (
          <OnboardingPage
            onRegisterSuccess={handleRegisterSuccess}
            onCancel={() => setCurrentRoute('landing')}
          />
        )}

        {currentRoute === 'test' && userProfile && testMaterial && settings && (
          <TestPage
            userProfile={userProfile}
            testMaterial={testMaterial}
            settings={settings}
            onTestSubmit={handleTestSubmit}
          />
        )}

        {currentRoute === 'results' && userProfile && (
          <ResultsPage
            userProfile={userProfile}
            sessionId={userProfile.uid}
            onExit={() => setCurrentRoute('landing')}
          />
        )}

        {currentRoute === 'admin' && (
          <AdminPage
            onExit={() => setCurrentRoute('landing')}
          />
        )}

      </div>
    </LanguageProvider>
  );
}
