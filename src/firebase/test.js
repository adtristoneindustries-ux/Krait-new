import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    // Test write
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, { 
      timestamp: new Date().toISOString(),
      status: 'connected' 
    });
    
    // Test read
    const testDoc = await getDoc(testRef);
    
    if (testDoc.exists()) {
      console.log('✅ Firebase connection successful');
      return true;
    } else {
      console.error('❌ Firebase connection failed - document not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};