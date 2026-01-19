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
import { db } from './config';

// Patent operations - FIRESTORE DATABASE ONLY
export const addPatent = async (patentData) => {
  const docRef = await addDoc(collection(db, 'patents'), {
    ...patentData,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...patentData, createdAt: new Date().toISOString() };
};

export const updatePatent = async (patentId, patentData) => {
  const patentRef = doc(db, 'patents', patentId);
  
  const flattenedData = {
    ...patentData,
    updatedAt: new Date().toISOString()
  };
  
  // Handle details with size checking
  if (flattenedData.details) {
    const detailsString = JSON.stringify(flattenedData.details);
    
    // Check if details JSON is too large for Firestore (1MB limit)
    if (detailsString.length > 900000) { // 900KB safety margin
      throw new Error('Too much data to store. Please use smaller files or fewer files.');
    }
    
    flattenedData.detailsJson = detailsString;
    delete flattenedData.details;
  }
  
  await updateDoc(patentRef, flattenedData);
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
    const data = { id: doc.id, ...doc.data() };
    
    // Parse JSON string back to object if it exists
    if (data.detailsJson) {
      try {
        data.details = JSON.parse(data.detailsJson);
        delete data.detailsJson;
      } catch (error) {
        console.error('Error parsing details JSON:', error);
      }
    }
    
    patents.push(data);
  });
  
  return patents;
};

export const getPatent = async (patentId) => {
  const docRef = doc(db, 'patents', patentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = { id: docSnap.id, ...docSnap.data() };
    
    // Parse JSON string back to object if it exists
    if (data.detailsJson) {
      try {
        data.details = JSON.parse(data.detailsJson);
        delete data.detailsJson;
      } catch (error) {
        console.error('Error parsing details JSON:', error);
      }
    }
    
    return data;
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

// File processing - Handle larger files
export const uploadFile = async (file) => {
  let processedFile = file;
  
  // Compress only images, leave documents as-is
  if (file.type.startsWith('image/')) {
    if (file.size > 1024 * 1024) { // 1MB threshold
      processedFile = await compressImage(file, 0.6, 800); // 60% quality, 800px max
    }
  }
  
  // Larger size limit for documents
  if (processedFile.size > 50 * 1024 * 1024) { // 50MB limit
    throw new Error('File too large. Please use a smaller file (max 50MB).');
  }
  
  const base64URL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(processedFile);
  });
  
  return {
    name: file.name,
    url: base64URL,
    size: processedFile.size,
    uploadedAt: new Date().toISOString()
  };
};

// Signature processing - Compress and convert to base64
export const uploadSignature = async (file) => {
  let processedFile = file;
  
  if (file.size > 500 * 1024) {
    processedFile = await compressImage(file, 0.8, 400);
  }
  
  const base64URL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(processedFile);
  });
  
  return base64URL;
};

// Author operations - FIRESTORE DATABASE ONLY
export const saveAuthor = async (patentId, positionId, authorData) => {
  const authorRef = doc(db, 'authors', `${patentId}_${positionId}`);
  await setDoc(authorRef, {
    ...authorData,
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