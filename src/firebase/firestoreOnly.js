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
  getDownloadURL,
  deleteObject,
  listAll 
} from 'firebase/storage';
import { db, storage } from './config';

// Patent operations with complete details - all data in patents collection
export const addPatent = async (patentData) => {
  // Use patent title as document ID for easy finding
  const docRef = doc(db, 'patents', patentData.title);
  
  await setDoc(docRef, {
    title: patentData.title,
    status: patentData.status,
    form1: patentData.form1 || null,
    form21: patentData.form21 || null,
    representationSheet: patentData.representationSheet || null,
    form21Stamp: patentData.form21Stamp || null,
    doc1: patentData.doc1 || null,
    doc2: patentData.doc2 || null,
    doc3: patentData.doc3 || null,
    positions: patentData.positions || [],
    authors: patentData.authors || {},
    createdAt: new Date().toISOString()
  });
  
  return { id: patentData.title, ...patentData, createdAt: new Date().toISOString() };
};

export const updatePatent = async (patentId, patentData) => {
  const patentRef = doc(db, 'patents', patentId);
  
  // Only update the fields that are provided
  const updateData = {
    ...patentData,
    updatedAt: new Date().toISOString()
  };
  
  await updateDoc(patentRef, updateData);
  return { id: patentId, ...updateData };
};

export const deletePatent = async (patentId) => {
  console.log('Deleting patent:', patentId);
  
  try {
    // Get patent data first
    const patent = await getPatent(patentId);
    if (!patent) {
      console.log('Patent not found');
      return;
    }
    
    // Delete entire patent folder from Firebase Storage
    try {
      // List all files in the patent folder
      const { listAll } = await import('firebase/storage');
      const folderRef = ref(storage, patent.title);
      const listResult = await listAll(folderRef);
      
      // Delete all files in the folder
      const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
      
      // Delete all subfolders
      const subfolderPromises = listResult.prefixes.map(async (prefixRef) => {
        const subList = await listAll(prefixRef);
        const subDeletePromises = subList.items.map(itemRef => deleteObject(itemRef));
        return Promise.all(subDeletePromises);
      });
      await Promise.all(subfolderPromises);
      
      console.log('Patent folder deleted from storage:', patent.title);
    } catch (storageError) {
      console.log('Storage cleanup completed or folder was empty');
    }
    
    // Delete patent document from Firestore
    await deleteDoc(doc(db, 'patents', patentId));
    console.log('Patent deleted successfully');
    
  } catch (error) {
    console.error('Error deleting patent:', error);
    throw error;
  }
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

// Signature upload to Firebase Storage - under patent title
export const uploadSignature = async (file, patentTitle, positionNo) => {
  const fileName = `signature_position_${positionNo}_${Date.now()}.${file.name.split('.').pop()}`;
  const fileRef = ref(storage, `${patentTitle}/signatures/${fileName}`);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  return {
    fileName: fileName,
    url: downloadURL,
    uploadedAt: new Date().toISOString()
  };
};

// Author operations - save to patents collection
export const saveAuthor = async (patentId, positionId, authorData) => {
  console.log('saveAuthor called with:', { patentId, positionId, authorData });
  
  if (!authorData) {
    throw new Error('Author data is required');
  }
  
  const patentRef = doc(db, 'patents', patentId);
  const patent = await getDoc(patentRef);
  
  if (!patent.exists()) {
    throw new Error('Patent not found');
  }
  
  const patentData = patent.data();
  const authors = patentData.authors || {};
  
  authors[positionId] = {
    fullName: authorData.fullName || authorData.name || '',
    department: authorData.department || '',
    designation: authorData.designation || '',
    college: authorData.college || '',
    email: authorData.email || '',
    mobile: authorData.mobile || '',
    signatureFileName: authorData.signatureFileName || '',
    signatureUrl: authorData.signatureUrl || '',
    amount: authorData.amount || '0',
    pendingAmount: authorData.pendingAmount || '0',
    savedAt: new Date().toISOString()
  };
  
  await updateDoc(patentRef, { authors });
  console.log('Author saved to patents collection');
  return authors[positionId];
};

export const getAuthors = async (patentId) => {
  console.log('Getting authors for patent:', patentId);
  const patent = await getPatent(patentId);
  return patent?.authors || {};
};