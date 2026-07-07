import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { TestResult } from '../types';
import { generateUUID } from '../utils/uuid';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export const resultService = {
  // Save/Submit final calculated test results, syncing sub-objects cleanly to writing and speaking collections (No Duplication)
  async saveResult(result: TestResult): Promise<void> {
    const collPath = 'results';
    try {
      const timestamp = new Date().toISOString();

      // 1. Sync writing sheet
      if (result.writingId) {
        await updateDoc(doc(db, 'writing', result.writingId), {
          essayAnswer: result.writing.essayAnswer || '',
          score: result.writing.score ?? 0,
          maxScore: result.writing.maxScore ?? 9,
          band: result.writing.band ?? 'A1',
          feedback: result.writing.feedback ?? '',
          aiEvaluation: result.writing.aiEvaluation || null,
          updatedAt: timestamp
        });
      }

      // 2. Sync speaking sheet
      if (result.speakingId) {
        await updateDoc(doc(db, 'speaking', result.speakingId), {
          speakingAudioUrl: result.speaking.speakingAudioUrl || '',
          speakingTranscript: result.speaking.speakingTranscript || '',
          score: result.speaking.score ?? 0,
          maxScore: result.speaking.maxScore ?? 9,
          band: result.speaking.band ?? 'A1',
          feedback: result.speaking.feedback ?? '',
          aiEvaluation: result.speaking.aiEvaluation || null,
          updatedAt: timestamp
        });
      }

      // 3. Save core results record
      await setDoc(doc(db, 'results', result.id), {
        id: result.id,
        candidateId: result.candidateId,
        candidateName: result.candidateName,
        candidateEmail: result.candidateEmail,
        candidatePhone: result.candidatePhone || '',
        examId: result.examId || '',
        listening: result.listening,
        reading: result.reading,
        writingId: result.writingId,
        speakingId: result.speakingId,
        overallCEFR: result.overallCEFR,
        status: result.status,
        gradedBy: result.gradedBy,
        createdAt: result.createdAt,
        completedAt: result.completedAt,
        updatedAt: timestamp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collPath);
    }
  },

  // Fetch results by Candidate ID, dynamically stitching writing and speaking documents
  async getResultByCandidateId(candidateId: string): Promise<TestResult | null> {
    const collPath = 'results';
    try {
      // Check results collection
      const rq = query(collection(db, 'results'), where('candidateId', '==', candidateId), limit(1));
      const rSnap = await getDocs(rq);

      if (!rSnap.empty) {
        const resultDoc = rSnap.docs[0];
        const data = resultDoc.data();

        // Stitch writing document
        const writingDoc = await getDoc(doc(db, 'writing', data.writingId));
        // Stitch speaking document
        const speakingDoc = await getDoc(doc(db, 'speaking', data.speakingId));

        return {
          ...data,
          writing: writingDoc.exists() ? {
            score: writingDoc.data().score ?? 0,
            maxScore: writingDoc.data().maxScore ?? 9,
            band: writingDoc.data().band ?? 'A1',
            feedback: writingDoc.data().feedback ?? '',
            essayAnswer: writingDoc.data().essayAnswer ?? '',
            aiEvaluation: writingDoc.data().aiEvaluation
          } : { score: 0, maxScore: 9, band: 'A1', feedback: '', essayAnswer: '' },
          speaking: speakingDoc.exists() ? {
            score: speakingDoc.data().score ?? 0,
            maxScore: speakingDoc.data().maxScore ?? 9,
            band: speakingDoc.data().band ?? 'A1',
            feedback: speakingDoc.data().feedback ?? '',
            speakingAudioUrl: speakingDoc.data().speakingAudioUrl ?? '',
            speakingTranscript: speakingDoc.data().speakingTranscript ?? '',
            aiEvaluation: speakingDoc.data().aiEvaluation
          } : { score: 0, maxScore: 9, band: 'A1', feedback: '' }
        } as any;
      }

      // Fallback: If no result exists yet, compile standard initial grades from completed exams
      const eq = query(
        collection(db, 'exams'),
        where('candidateId', '==', candidateId),
        where('status', '==', 'completed'),
        orderBy('endTime', 'desc'),
        limit(1)
      );
      const eSnap = await getDocs(eq);
      if (!eSnap.empty) {
        const examDoc = eSnap.docs[0];
        const examData = examDoc.data();
        const examId = examDoc.id;
        const writingId = examData.writingId;
        const speakingId = examData.speakingId;

        const writingDoc = await getDoc(doc(db, 'writing', writingId));
        const speakingDoc = await getDoc(doc(db, 'speaking', speakingId));

        // Auto-grade MCQs
        const answers = examData.answers || {};
        let lScore = 0;
        if (answers['l1'] === '2') lScore++;
        if (answers['l2'] === '1') lScore++;
        if (answers['l3']?.toLowerCase().trim() === 'vegetarian') lScore++;
        if (answers['l4'] === '1') lScore++;
        if (answers['l5']?.toLowerCase().trim() === 'friday') lScore++;

        let rScore = 0;
        if (answers['r1'] === '1') rScore++;
        if (answers['r2'] === '1') rScore++;
        if (answers['r3']?.toLowerCase().trim() === 'lead') rScore++;
        if (answers['r4'] === '1') rScore++;
        if (answers['r5'] === '1') rScore++;
        if (answers['r6']?.toLowerCase().trim() === 'hashes') rScore++;
        if (answers['r7'] === '1') rScore++;

        const getCefr = (score: number, max: number) => {
          const pct = score / max;
          if (pct >= 0.9) return 'C1';
          if (pct >= 0.75) return 'B2';
          if (pct >= 0.5) return 'B1';
          if (pct >= 0.3) return 'A2';
          return 'A1';
        };

        const lBand = getCefr(lScore, 5);
        const rBand = getCefr(rScore, 7);

        const initialResult: TestResult = {
          id: generateUUID(),
          candidateId,
          candidateName: '',
          candidateEmail: '',
          candidatePhone: '',
          createdAt: examData.createdAt || new Date().toISOString(),
          completedAt: examData.endTime || new Date().toISOString(),
          listening: {
            score: lScore,
            maxScore: 5,
            band: lBand,
            feedback: `Standard correct options identified: ${lScore}/5.`
          },
          reading: {
            score: rScore,
            maxScore: 7,
            band: rBand,
            feedback: `Linguistic diagnostic answers scored at ${rScore}/7.`
          },
          writing: {
            score: 0,
            maxScore: 9,
            band: 'Pending',
            feedback: 'Draft essay submitted. Grading in progress.',
            essayAnswer: writingDoc.exists() ? (writingDoc.data().essayAnswer || '') : ''
          },
          speaking: {
            score: 0,
            maxScore: 9,
            band: 'Pending',
            feedback: 'Oral answer submitted. Grading in progress.',
            speakingAudioUrl: speakingDoc.exists() ? (speakingDoc.data().speakingAudioUrl || '') : ''
          },
          overallCEFR: 'B1',
          status: 'pending',
          gradedBy: 'auto',
          writingId,
          speakingId,
          examId
        } as any;

        const cDoc = await getDoc(doc(db, 'candidates', candidateId));
        if (cDoc.exists()) {
          initialResult.candidateName = cDoc.data().name;
          initialResult.candidateEmail = cDoc.data().email;
          initialResult.candidatePhone = cDoc.data().phone || '';
        }

        // Save inside database (non-duplicated flat fields)
        await setDoc(doc(db, 'results', initialResult.id), {
          id: initialResult.id,
          candidateId: initialResult.candidateId,
          candidateName: initialResult.candidateName,
          candidateEmail: initialResult.candidateEmail,
          candidatePhone: initialResult.candidatePhone,
          examId: initialResult.examId,
          listening: initialResult.listening,
          reading: initialResult.reading,
          writingId: initialResult.writingId,
          speakingId: initialResult.speakingId,
          overallCEFR: initialResult.overallCEFR,
          status: initialResult.status,
          gradedBy: initialResult.gradedBy,
          createdAt: initialResult.createdAt,
          completedAt: initialResult.completedAt,
          updatedAt: new Date().toISOString()
        });

        return initialResult;
      }

      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, collPath);
    }
  },

  // Fetch all results for admin dashboards, stitching sub-documents
  async getAllResults(): Promise<TestResult[]> {
    const collPath = 'results';
    try {
      const q = query(collection(db, 'results'), orderBy('completedAt', 'desc'));
      const snap = await getDocs(q);
      const results: TestResult[] = [];

      for (const d of snap.docs) {
        const data = d.data();
        const writingDoc = await getDoc(doc(db, 'writing', data.writingId));
        const speakingDoc = await getDoc(doc(db, 'speaking', data.speakingId));

        results.push({
          ...data,
          writing: writingDoc.exists() ? {
            score: writingDoc.data().score ?? 0,
            maxScore: writingDoc.data().maxScore ?? 9,
            band: writingDoc.data().band ?? 'A1',
            feedback: writingDoc.data().feedback ?? '',
            essayAnswer: writingDoc.data().essayAnswer ?? '',
            aiEvaluation: writingDoc.data().aiEvaluation
          } : { score: 0, maxScore: 9, band: 'A1', feedback: '', essayAnswer: '' },
          speaking: speakingDoc.exists() ? {
            score: speakingDoc.data().score ?? 0,
            maxScore: speakingDoc.data().maxScore ?? 9,
            band: speakingDoc.data().band ?? 'A1',
            feedback: speakingDoc.data().feedback ?? '',
            speakingAudioUrl: speakingDoc.data().speakingAudioUrl ?? '',
            speakingTranscript: speakingDoc.data().speakingTranscript ?? '',
            aiEvaluation: speakingDoc.data().aiEvaluation
          } : { score: 0, maxScore: 9, band: 'A1', feedback: '' }
        } as any);
      }
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collPath);
    }
  },

  // Listen / Subscribe to results (polled fallback)
  async subscribeToResult(candidateId: string, callback: (result: TestResult | null) => void): Promise<() => void> {
    try {
      const res = await this.getResultByCandidateId(candidateId);
      callback(res);
    } catch (err) {
      console.error("Error inside subscribeToResult polling:", err);
      callback(null);
    }
    return () => {};
  },

  // Update specific scores or grades, updating flat results record and the sub-collection sheets
  async updateResult(resultId: string, updates: Partial<TestResult>): Promise<void> {
    const collPath = `results/${resultId}`;
    try {
      const docRef = doc(db, 'results', resultId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const timestamp = new Date().toISOString();

        // 1. Sync writing
        if (updates.writing && data.writingId) {
          await updateDoc(doc(db, 'writing', data.writingId), {
            essayAnswer: updates.writing.essayAnswer || '',
            score: updates.writing.score ?? 0,
            maxScore: updates.writing.maxScore ?? 9,
            band: updates.writing.band ?? 'A1',
            feedback: updates.writing.feedback ?? '',
            aiEvaluation: updates.writing.aiEvaluation || null,
            updatedAt: timestamp
          });
        }

        // 2. Sync speaking
        if (updates.speaking && data.speakingId) {
          await updateDoc(doc(db, 'speaking', data.speakingId), {
            speakingAudioUrl: updates.speaking.speakingAudioUrl || '',
            speakingTranscript: updates.speaking.speakingTranscript || '',
            score: updates.speaking.score ?? 0,
            maxScore: updates.speaking.maxScore ?? 9,
            band: updates.speaking.band ?? 'A1',
            feedback: updates.speaking.feedback ?? '',
            aiEvaluation: updates.speaking.aiEvaluation || null,
            updatedAt: timestamp
          });
        }

        // 3. Update core fields
        const flatUpdates: any = { updatedAt: timestamp };
        if (updates.overallCEFR !== undefined) flatUpdates.overallCEFR = updates.overallCEFR;
        if (updates.status !== undefined) flatUpdates.status = updates.status;
        if (updates.gradedBy !== undefined) flatUpdates.gradedBy = updates.gradedBy;
        if (updates.listening !== undefined) flatUpdates.listening = updates.listening;
        if (updates.reading !== undefined) flatUpdates.reading = updates.reading;

        await updateDoc(docRef, flatUpdates);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, collPath);
    }
  },

  // Reset all exam attempts, results, writing, speaking documents, and candidate submission status for a student
  async resetCandidateAttempt(candidateId: string): Promise<void> {
    try {
      // 1. Delete result from 'results'
      const rq = query(collection(db, 'results'), where('candidateId', '==', candidateId));
      const rSnap = await getDocs(rq);
      for (const rDoc of rSnap.docs) {
        await deleteDoc(doc(db, 'results', rDoc.id));
      }

      // 2. Delete exam sessions from 'exams'
      const eq = query(collection(db, 'exams'), where('candidateId', '==', candidateId));
      const eSnap = await getDocs(eq);
      for (const eDoc of eSnap.docs) {
        await deleteDoc(doc(db, 'exams', eDoc.id));
      }

      // 3. Delete from 'writing' sheet
      const wq = query(collection(db, 'writing'), where('candidateId', '==', candidateId));
      const wSnap = await getDocs(wq);
      for (const wDoc of wSnap.docs) {
        await deleteDoc(doc(db, 'writing', wDoc.id));
      }

      // 4. Delete from 'speaking' sheet
      const sq = query(collection(db, 'speaking'), where('candidateId', '==', candidateId));
      const sSnap = await getDocs(sq);
      for (const sDoc of sSnap.docs) {
        await deleteDoc(doc(db, 'speaking', sDoc.id));
      }

      // 5. Update candidate document 'examSubmitted: false'
      const candidateRef = doc(db, 'candidates', candidateId);
      await updateDoc(candidateRef, {
        examSubmitted: false,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error resetting candidate attempt:", err);
      throw err;
    }
  }
};
export default resultService;
