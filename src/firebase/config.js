import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGlYNZADXjMETPeBUcAQtbWYZxu-iKsCs",
  authDomain: "krait-publishing.firebaseapp.com",
  projectId: "krait-publishing",
  storageBucket: "krait-publishing.appspot.com",
  messagingSenderId: "1015189229660",
  appId: "1:1015189229660:web:c1240a28f3c3b4ba71d699"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;