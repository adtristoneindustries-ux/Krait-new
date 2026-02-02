import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAGlYNZADXjMETPeBUcAQtbWYZxu-iKsCs",
  authDomain: "krait-publishing.firebaseapp.com",
  projectId: "krait-publishing",
  storageBucket: "krait-publishing.firebasestorage.app",
  messagingSenderId: "1015189229660",
  appId: "1:1015189229660:web:c1240a28f3c3b4ba71d699"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
