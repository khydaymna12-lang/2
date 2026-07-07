export type Language = 'en' | 'vi';

export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  language: Language;
  createdAt: string;
  targetScore?: string;
  targetLevel?: string;
  isLocked?: boolean;
  examSubmitted?: boolean;
}

export type SectionType = 'listening' | 'reading' | 'writing' | 'speaking';

export interface Question {
  id: string;
  section: 'listening' | 'reading';
  type: 'multiple-choice' | 'gap-fill';
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string; // The correct answer text or index
  placeholder?: string; // For gap-fill
  audioUrl?: string; // For listening if question-specific
}

export interface ReadingPassage {
  id: string;
  title: string;
  text: string;
  questions: Question[];
}

export interface TestMaterial {
  id: string;
  listeningAudioUrl: string;
  listeningQuestions: Question[];
  readingPassages: ReadingPassage[];
  writingPrompt: string;
  writingTargetWords: number;
  speakingPrompt: string;
  speakingPreparationTime: number; // in seconds
  speakingRecordingTime: number; // in seconds
}

export interface TestSession {
  id: string;
  candidateId: string;
  status: 'ongoing' | 'completed';
  startTime: string;
  endTime?: string;
  timeLeft: number; // in seconds
  answers: Record<string, string>; // questionId -> candidateAnswer
  essayAnswer?: string;
  speakingAudioUrl?: string;
  speakingTranscript?: string;
}

export interface EvaluationCriteria {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface SectionResult {
  score: number;
  maxScore: number;
  band: string; // CEFR Level (A1, A2, B1, B2, C1, C2) or IELTS Band
  feedback: string;
}

export interface AISpeakingEvaluation {
  pronunciation: EvaluationCriteria;
  fluency: EvaluationCriteria;
  vocabulary: EvaluationCriteria;
  grammar: EvaluationCriteria;
  transcript: string;
  feedback: string;
  cefrLevel: string;
}

export interface AIWritingEvaluation {
  taskAchievement: EvaluationCriteria;
  coherence: EvaluationCriteria;
  vocabulary: EvaluationCriteria;
  grammar: EvaluationCriteria;
  feedback: string;
  modelAnswer: string;
  cefrLevel: string;
}

export interface TestResult {
  id: string; // Matches Session ID or generated
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  createdAt: string;
  completedAt: string;
  listening: SectionResult;
  reading: SectionResult;
  writing: SectionResult & {
    essayAnswer: string;
    aiEvaluation?: AIWritingEvaluation;
  };
  speaking: SectionResult & {
    speakingAudioUrl?: string;
    speakingTranscript?: string;
    aiEvaluation?: AISpeakingEvaluation;
  };
  overallCEFR: string; // A1, A2, B1, B2, C1, C2
  status: 'pending' | 'completed';
  gradedBy: 'auto' | 'ai' | 'admin';
  writingId?: string;
  speakingId?: string;
  examId?: string;
}

export interface TestSettings {
  testDuration: number; // in minutes
  passingScore: number; // percentage or numerical
  allowSkipSections: boolean;
  activeSections: SectionType[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonRecommendation {
  id: string;
  title: string;
  category: 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary';
  level: string; // A1-C2
  description: string;
  tips: string[];
}

export interface AdminProfile {
  id: string; // Matches user UID
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface WritingSubmission {
  id: string; // UUID
  examId: string; // UUID of exam
  candidateId: string; // UID of candidate
  essayAnswer: string;
  aiEvaluation?: AIWritingEvaluation;
  score: number;
  maxScore: number;
  band: string;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakingSubmission {
  id: string; // UUID
  examId: string; // UUID of exam
  candidateId: string; // UID of candidate
  speakingAudioUrl?: string;
  speakingTranscript?: string;
  aiEvaluation?: AISpeakingEvaluation;
  score: number;
  maxScore: number;
  band: string;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

