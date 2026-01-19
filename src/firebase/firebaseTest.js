import { db } from './config';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test write
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Firebase write test successful:', testDoc.id);
    
    // Test read
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Firebase read test successful, documents:', querySnapshot.size);
    
    // Clean up test document
    await deleteDoc(doc(db, 'test', testDoc.id));
    console.log('✅ Firebase delete test successful');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};