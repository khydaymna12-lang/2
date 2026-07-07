import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export const authService = {
  // Listen for auth state changes and fetch user role/profile
  subscribeToAuthChanges(callback: (profile: UserProfile | null) => void): () => void {
    // 1. Check for student session first in localStorage
    const savedStudent = localStorage.getItem('ep_student_session');
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        // Refresh from Firestore to make sure lock status or submission status is fresh
        getDoc(doc(db, 'candidates', parsed.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const freshProfile = docSnap.data() as UserProfile;
            if (freshProfile.isLocked) {
              localStorage.removeItem('ep_student_session');
              callback(null);
            } else {
              localStorage.setItem('ep_student_session', JSON.stringify(freshProfile));
              callback(freshProfile);
            }
          } else {
            callback(parsed);
          }
        }).catch((err) => {
          console.error("Error refreshing candidate session:", err);
          callback(parsed);
        });
        
        // Return a dummy unsubscribe
        return () => {};
      } catch (e) {
        localStorage.removeItem('ep_student_session');
      }
    }

    // 2. Otherwise fall back to Firebase Auth state for Admin
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Check admins collection first
          const adminDocPath = `admins/${firebaseUser.uid}`;
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, adminDocPath);
          }

          if (userDoc.exists()) {
            const adminData = userDoc.data();
            callback({
              uid: firebaseUser.uid,
              name: adminData.name || 'Admin',
              email: adminData.email || firebaseUser.email || '',
              role: 'admin',
              language: 'en',
              createdAt: adminData.createdAt || new Date().toISOString()
            });
            return;
          }

          // If logged in via Firebase but not an admin, sign them out
          await signOut(auth);
          callback(null);
        } catch (error) {
          console.error("Error fetching user profile in auth subscriber:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // Student login/registration using Full Name and Phone Number (without Firebase Auth)
  async studentLogin(
    name: string, 
    phone: string, 
    optionalFields?: { 
      email?: string; 
      targetScore?: string; 
      targetLevel?: string; 
      estimateLevel?: string;
    }
  ): Promise<UserProfile> {
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (!cleanName || !cleanPhone) {
      throw new Error('Full Name and Phone Number are required.');
    }

    try {
      // Search Firestore candidates collection for an exact match of name and phone number
      const q = query(
        collection(db, 'candidates'),
        where('name', '==', cleanName),
        where('phone', '==', cleanPhone),
        limit(1)
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const candidateDoc = querySnap.docs[0];
        const profile = candidateDoc.data() as UserProfile;

        if (profile.isLocked) {
          throw new Error('Your account is locked by the teacher. You cannot access any exam.');
        }

        // Save to localStorage for persistent session
        localStorage.setItem('ep_student_session', JSON.stringify(profile));
        return profile;
      }

      // If not found, register them as a new student
      const uid = 'cand_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const profile: UserProfile = {
        uid,
        name: cleanName,
        email: optionalFields?.email?.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@eptest.org`,
        phone: cleanPhone,
        role: 'student',
        language: 'en',
        createdAt: new Date().toISOString(),
        isLocked: false,
        examSubmitted: false,
        targetScore: optionalFields?.targetScore || '',
        targetLevel: optionalFields?.targetLevel || 'B2'
      };

      await setDoc(doc(db, 'candidates', uid), {
        ...profile,
        updatedAt: new Date().toISOString()
      });

      // Save to localStorage
      localStorage.setItem('ep_student_session', JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      console.error("Error inside studentLogin:", err);
      throw err;
    }
  },

  // Direct login for admin (using email/password)
  async loginUser(email: string, password: string): Promise<UserProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const uid = userCredential.user.uid;

    // Check if admin
    const adminDocPath = `admins/${uid}`;
    let adminDoc;
    try {
      adminDoc = await getDoc(doc(db, 'admins', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, adminDocPath);
    }

    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return {
        uid,
        name: adminData.name || 'Admin',
        email: adminData.email || email,
        role: 'admin',
        language: 'en',
        createdAt: adminData.createdAt || new Date().toISOString()
      };
    }

    // Since students DO NOT use Firebase Authentication, login of non-admin Firebase users is rejected
    await signOut(auth);
    throw new Error('Access denied. Profile not found in Admin database.');
  },

  // Logout current user
  async logout(): Promise<void> {
    localStorage.removeItem('ep_student_session');
    await signOut(auth);
  },

  // Get current raw firebase user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Elevate a user or seed an Admin
  async seedAdminUser(email: string, name: string): Promise<UserProfile> {
    const sanitizedEmail = email.trim().toLowerCase();
    const password = "AdminPassword123!";
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const uid = userCredential.user.uid;
      const profile: UserProfile = {
        uid,
        name: name.trim(),
        email: sanitizedEmail,
        role: 'admin',
        language: 'en',
        createdAt: new Date().toISOString()
      };

      const docPath = `admins/${uid}`;
      try {
        await setDoc(doc(db, 'admins', uid), {
          id: uid,
          name: name.trim(),
          email: sanitizedEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }

      return profile;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
        const uid = userCredential.user.uid;
        const profile: UserProfile = {
          uid,
          name: name.trim(),
          email: sanitizedEmail,
          role: 'admin',
          language: 'en',
          createdAt: new Date().toISOString()
        };

        const docPath = `admins/${uid}`;
        try {
          await setDoc(doc(db, 'admins', uid), {
            id: uid,
            name: name.trim(),
            email: sanitizedEmail,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, docPath);
        }

        return profile;
      }
      throw error;
    }
  }
};
