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
  getStorage,
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db } from './config';

const storage = getStorage();

// Upload file to Firebase Storage
export const uploadFileToStorage = async (file, patentId, fileType) => {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `patents/${patentId}/${fileType}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    name: file.name,
    fileName: fileName,
    url: downloadURL,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString()
  };
};

// Upload signature to Firebase Storage
export const uploadSignatureToStorage = async (file, authorId) => {
  const fileName = `signature_${authorId}_${Date.now()}.${file.name.split('.').pop()}`;
  const storageRef = ref(storage, `signatures/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    fileName: fileName,
    url: downloadURL,
    uploadedAt: new Date().toISOString()
  };
};

// Patent operations
export const addPatent = async (patentData) => {
  const docRef = await addDoc(collection(db, 'patents'), {
    title: patentData.title,
    status: patentData.status,
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

export const deletePatent = async (patentId) => {
  await deleteDoc(doc(db, 'patents', patentId));
  
  // Delete related data
  const collections = ['files', 'positions', 'authors'];
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    snapshot.forEach((document) => {
      const data = document.data();
      if (data.patentId === patentId) {
        deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
      }
    });
    
    await Promise.all(deletePromises);
  }
};

// File operations
export const saveFileRecord = async (patentId, fileType, fileData) => {
  await addDoc(collection(db, 'files'), {
    patentId,
    fileType,
    fileName: fileData.name,
    storageFileName: fileData.fileName,
    url: fileData.url,
    size: fileData.size,
    type: fileData.type,
    uploadedAt: fileData.uploadedAt
  });
};

export const getPatentFiles = async (patentId) => {
  const snapshot = await getDocs(collection(db, 'files'));
  const files = {};
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.patentId === patentId) {
      if (!files[data.fileType]) {
        files[data.fileType] = [];
      }
      files[data.fileType].push({ id: doc.id, ...data });
    }
  });
  
  return files;
};

// Position operations
export const savePosition = async (patentId, positionData) => {
  await addDoc(collection(db, 'positions'), {
    patentId,
    positionNumber: positionData.positionNumber,
    amount: positionData.amount,
    pendingAmount: positionData.pendingAmount,
    authorId: positionData.authorId,
    createdAt: new Date().toISOString()
  });
};

export const getPatentPositions = async (patentId) => {
  const snapshot = await getDocs(collection(db, 'positions'));
  const positions = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.patentId === patentId) {
      positions.push({ id: doc.id, ...data });
    }
  });
  
  return positions;
};

// Author operations
export const saveAuthor = async (authorData) => {
  const docRef = await addDoc(collection(db, 'authors'), {
    ...authorData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAuthor = async (authorId) => {
  const docRef = doc(db, 'authors', authorId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};