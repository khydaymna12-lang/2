import { collection, doc, getDoc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export const candidateService = {
  // Fetch candidate details by ID
  async getCandidateById(uid: string): Promise<UserProfile | null> {
    const docPath = `candidates/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'candidates', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  },

  // Fetch all candidates (for admin views)
  async getAllCandidates(): Promise<UserProfile[]> {
    const collPath = 'candidates';
    try {
      const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const candidates: UserProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        candidates.push(docSnap.data() as UserProfile);
      });
      return candidates;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collPath);
    }
  },

  // Update candidate preferred language
  async updateLanguage(uid: string, language: 'en' | 'vi'): Promise<void> {
    const docPath = `candidates/${uid}`;
    try {
      const userRef = doc(db, 'candidates', uid);
      await updateDoc(userRef, { 
        language,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  },

  // Update candidate target/profile details
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docPath = `candidates/${uid}`;
    try {
      const userRef = doc(db, 'candidates', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }
};
