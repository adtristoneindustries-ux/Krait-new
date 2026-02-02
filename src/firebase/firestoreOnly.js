import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from './config';

// Patent operations with complete details
export const addPatent = async (patentData) => {
  const docRef = await addDoc(collection(db, 'patents'), {
    title: patentData.title,
    status: patentData.status,
    // File details
    form1: patentData.form1 || null,
    form21: patentData.form21 || null,
    representationSheet: patentData.representationSheet || null,
    form21Stamp: patentData.form21Stamp || null,
    document1: patentData.document1 || null,
    document2: patentData.document2 || null,
    document3: patentData.document3 || null,
    // Position details
    positions: patentData.positions || [],
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...patentData, createdAt: new Date().toISOString() };
};

export const updatePatent = async (patentId, patentData) => {
  const patentRef = doc(db, 'patents', patentId);
  
  await updateDoc(patentRef, {
    ...patentData,
    updatedAt: new Date().toISOString()
  });
  return { id: patentId, ...patentData };
};

export const deletePatent = async (patentId) => {
  await deleteDoc(doc(db, 'patents', patentId));
  
  // Delete all authors for this patent
  const authorsSnapshot = await getDocs(collection(db, 'authors'));
  const deletePromises = [];
  
  authorsSnapshot.forEach((authorDoc) => {
    const data = authorDoc.data();
    if (data.patentId === patentId) {
      deletePromises.push(deleteDoc(doc(db, 'authors', authorDoc.id)));
    }
  });
  
  await Promise.all(deletePromises);
};

export const getPatents = async () => {
  const q = query(collection(db, 'patents'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  const patents = [];
  
  querySnapshot.forEach((doc) => {
    patents.push({ id: doc.id, ...doc.data() });
  });
  
  return patents;
};

export const getPatent = async (patentId) => {
  const docRef = doc(db, 'patents', patentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Image compression function
const compressImage = (file, quality = 0.7, maxWidth = 800) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// File upload to Firebase Storage
export const uploadFile = async (file, patentTitle, fileType) => {
  const fileName = `${Date.now()}_${file.name}`;
  const fileRef = ref(storage, `${patentTitle}/${fileType}/${fileName}`);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  return {
    name: file.name,
    fileName: fileName,
    url: downloadURL,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString()
  };
};

// Signature upload to Firebase Storage
export const uploadSignature = async (file, positionNo) => {
  const fileName = `signature_position_${positionNo}_${Date.now()}.${file.name.split('.').pop()}`;
  const fileRef = ref(storage, `signatures/${fileName}`);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  return {
    fileName: fileName,
    url: downloadURL,
    uploadedAt: new Date().toISOString()
  };
};

// Author operations with complete details
export const saveAuthor = async (patentId, positionId, authorData) => {
  const authorRef = doc(db, 'authors', `${patentId}_${positionId}`);
  await setDoc(authorRef, {
    // Author details in order
    fullName: authorData.fullName,
    department: authorData.department,
    designation: authorData.designation,
    college: authorData.college,
    email: authorData.email,
    mobile: authorData.mobile,
    signatureFileName: authorData.signatureFileName,
    signatureUrl: authorData.signatureUrl,
    amount: authorData.amount,
    pendingAmount: authorData.pendingAmount,
    // Reference data
    patentId,
    positionId,
    savedAt: new Date().toISOString()
  });
};

export const getAuthors = async (patentId) => {
  const authorsSnapshot = await getDocs(collection(db, 'authors'));
  const authors = {};
  
  authorsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.patentId === patentId) {
      authors[data.positionId] = data;
    }
  });
  
  return authors;
};