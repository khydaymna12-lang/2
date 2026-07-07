import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { TestSession } from '../types';
import { generateUUID } from '../utils/uuid';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export const examService = {
  // Start a new test session, pre-provisioning separate writing & speaking documents to isolate content
  async startSession(candidateId: string, durationMinutes: number): Promise<TestSession> {
    const examId = generateUUID();
    const writingId = generateUUID();
    const speakingId = generateUUID();

    const timestamp = new Date().toISOString();

    const session: TestSession = {
      id: examId,
      candidateId,
      status: 'ongoing',
      startTime: timestamp,
      timeLeft: durationMinutes * 60,
      answers: {},
      writingId,
      speakingId,
      createdAt: timestamp,
      updatedAt: timestamp
    } as any; // Cast safely due to structural extensions

    const examPath = `exams/${examId}`;
    try {
      // 1. Create companion empty writing sheet
      await setDoc(doc(db, 'writing', writingId), {
        id: writingId,
        examId,
        candidateId,
        essayAnswer: '',
        score: 0,
        maxScore: 9,
        band: 'A1',
        feedback: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // 2. Create companion empty speaking sheet
      await setDoc(doc(db, 'speaking', speakingId), {
        id: speakingId,
        examId,
        candidateId,
        speakingAudioUrl: '',
        speakingTranscript: '',
        score: 0,
        maxScore: 9,
        band: 'A1',
        feedback: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // 3. Create core exam tracking doc
      await setDoc(doc(db, 'exams', examId), session);

      return session;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, examPath);
    }
  },

  // Retrieve the current active/ongoing session for a candidate
  async getSession(candidateId: string): Promise<TestSession | null> {
    const collPath = 'exams';
    try {
      const q = query(
        collection(db, 'exams'),
        where('candidateId', '==', candidateId),
        where('status', '==', 'ongoing'),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const examDoc = querySnap.docs[0];
        return examDoc.data() as TestSession;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, collPath);
    }
  },

  // Save intermediate MCQ progress and write the essay answer directly to the 'writing' collection (No Duplication)
  async saveProgress(
    candidateId: string, 
    answers: Record<string, string>, 
    essayAnswer?: string,
    timeLeft?: number
  ): Promise<void> {
    const collPath = 'exams';
    try {
      const q = query(
        collection(db, 'exams'),
        where('candidateId', '==', candidateId),
        where('status', '==', 'ongoing'),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const examDoc = querySnap.docs[0];
        const examId = examDoc.id;
        const examData = examDoc.data();
        const writingId = examData.writingId;

        const timestamp = new Date().toISOString();

        // Save core exam answers
        const examUpdates: any = { 
          answers,
          updatedAt: timestamp
        };
        if (timeLeft !== undefined) {
          examUpdates.timeLeft = timeLeft;
        }
        await updateDoc(doc(db, 'exams', examId), examUpdates);

        // Save essay directly into the separate writing collection
        if (essayAnswer !== undefined && writingId) {
          await updateDoc(doc(db, 'writing', writingId), {
            essayAnswer,
            updatedAt: timestamp
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, collPath);
    }
  },

  // Update session speaking audio URL in the 'speaking' collection directly (No Duplication)
  async saveSpeakingAudioUrl(candidateId: string, url: string): Promise<void> {
    const collPath = 'exams';
    try {
      const q = query(
        collection(db, 'exams'),
        where('candidateId', '==', candidateId),
        where('status', '==', 'ongoing'),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const examData = querySnap.docs[0].data();
        const speakingId = examData.speakingId;
        if (speakingId) {
          await updateDoc(doc(db, 'speaking', speakingId), {
            speakingAudioUrl: url,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, collPath);
    }
  },

  // Finalize / submit a test session
  async submitSession(
    candidateId: string, 
    finalAnswers: Record<string, string>, 
    essayAnswer: string, 
    speakingAudioUrl?: string
  ): Promise<void> {
    const collPath = 'exams';
    try {
      const q = query(
        collection(db, 'exams'),
        where('candidateId', '==', candidateId),
        where('status', '==', 'ongoing'),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const examDoc = querySnap.docs[0];
        const examId = examDoc.id;
        const examData = examDoc.data();
        const writingId = examData.writingId;
        const speakingId = examData.speakingId;

        const timestamp = new Date().toISOString();

        // Finalize exam record
        await updateDoc(doc(db, 'exams', examId), {
          status: 'completed',
          endTime: timestamp,
          timeLeft: 0,
          answers: finalAnswers,
          updatedAt: timestamp
        });

        // Set examSubmitted to true on the candidate
        await updateDoc(doc(db, 'candidates', candidateId), {
          examSubmitted: true,
          updatedAt: timestamp
        });

        // Save final essay
        if (writingId) {
          await updateDoc(doc(db, 'writing', writingId), {
            essayAnswer,
            updatedAt: timestamp
          });
        }

        // Save final speaking URL
        if (speakingId && speakingAudioUrl) {
          await updateDoc(doc(db, 'speaking', speakingId), {
            speakingAudioUrl,
            updatedAt: timestamp
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, collPath);
    }
  }
};
