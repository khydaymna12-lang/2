import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TestSettings } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

const defaultSettings: TestSettings = {
  testDuration: 45, // 45 minutes
  passingScore: 60, // 60% standard passing score
  allowSkipSections: true,
  activeSections: ['listening', 'reading', 'writing', 'speaking']
};

export const settingService = {
  // Fetch application settings from Firestore
  async getSettings(): Promise<TestSettings> {
    const docPath = 'settings/test_config';
    const docRef = doc(db, 'settings', 'test_config');
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as TestSettings;
      } else {
        try {
          await setDoc(docRef, {
            ...defaultSettings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (setErr) {
          console.warn("Could not seed default settings to Firestore (expected for non-admins or offline):", setErr);
        }
        return defaultSettings;
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes('offline') || errMsg.includes('unavailable')) {
        console.warn("Using offline default settings:", errMsg);
      } else {
        console.error("Error loading test settings, using default:", e);
      }
      // If the GET operation itself has a permission error, propagate it
      if (e instanceof Error && e.message.includes('permission')) {
        handleFirestoreError(e, OperationType.GET, docPath);
      }
      return defaultSettings;
    }
  },

  // Save/update global application settings
  async saveSettings(settings: TestSettings): Promise<void> {
    const docPath = 'settings/test_config';
    try {
      const docRef = doc(db, 'settings', 'test_config');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }
};
export { defaultSettings };
