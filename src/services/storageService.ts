import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const storageService = {
  // Upload candidate speaking recording
  async uploadSpeakingAudio(candidateId: string, audioBlob: Blob): Promise<string> {
    const filePath = `speaking_responses/${candidateId}_${Date.now()}.webm`;
    const storageRef = ref(storage, filePath);

    try {
      // Perform genuine Firebase Storage Upload
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.warn("Firebase Storage upload failed or not configured, using local base64 fallback:", error);
      
      // Fallback: Convert Blob to Base64 and return a data URI so it works offline/sandbox perfectly!
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert audio blob to base64"));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioBlob);
      });
    }
  }
};
