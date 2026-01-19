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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

// Patent operations
export const addPatent = async (patentData) => {
  console.log('🔥 Firebase: Adding patent to Firestore:', patentData);
  
  // Always use localStorage due to Firebase permissions
  const localPatents = JSON.parse(localStorage.getItem('patents') || '[]');
  const counter = parseInt(localStorage.getItem('patentCounter') || '0') + 1;
  const newPatent = { 
    id: counter.toString(), 
    ...patentData, 
    createdAt: new Date().toISOString() 
  };
  localPatents.push(newPatent);
  localStorage.setItem('patents', JSON.stringify(localPatents));
  localStorage.setItem('patentCounter', counter.toString());
  
  console.log('✅ Patent saved to localStorage:', newPatent);
  return newPatent;
};

export const updatePatent = async (patentId, patentData) => {
  console.log('🔥 Updating patent in localStorage:', patentId);
  
  const localPatents = JSON.parse(localStorage.getItem('patents') || '[]');
  const patentIndex = localPatents.findIndex(p => p.id.toString() === patentId.toString());
  
  if (patentIndex !== -1) {
    localPatents[patentIndex] = { ...localPatents[patentIndex], ...patentData };
    localStorage.setItem('patents', JSON.stringify(localPatents));
    
    if (patentData.details) {
      localStorage.setItem(`patent_${patentId}_details`, JSON.stringify(patentData.details));
    }
    
    console.log('✅ Patent updated in localStorage');
    return localPatents[patentIndex];
  }
  throw new Error('Patent not found');
};

export const deletePatent = async (patentId) => {
  console.log('🔥 Deleting patent from localStorage:', patentId);
  
  const localPatents = JSON.parse(localStorage.getItem('patents') || '[]');
  const updatedPatents = localPatents.filter(p => p.id.toString() !== patentId.toString());
  localStorage.setItem('patents', JSON.stringify(updatedPatents));
  
  localStorage.removeItem(`patent_${patentId}_details`);
  localStorage.removeItem(`patent_${patentId}_authors`);
  
  console.log('✅ Patent deleted from localStorage');
};

export const getPatents = async () => {
  console.log('🔥 Getting patents from localStorage');
  const patents = JSON.parse(localStorage.getItem('patents') || '[]');
  console.log('✅ Retrieved', patents.length, 'patents from localStorage');
  return patents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getPatent = async (patentId) => {
  console.log('🔥 Getting patent from localStorage:', patentId);
  const patents = JSON.parse(localStorage.getItem('patents') || '[]');
  const patent = patents.find(p => p.id.toString() === patentId.toString());
  
  if (patent) {
    // Load details if available
    const details = JSON.parse(localStorage.getItem(`patent_${patentId}_details`) || 'null');
    if (details) {
      patent.details = details;
    }
  }
  
  return patent || null;
};

// Signature upload - LOCAL ONLY (no Firebase Storage to avoid CORS)
export const uploadSignature = async (file, authorId) => {
  try {
    console.log('📁 Processing signature locally for author:', authorId);
    
    // Validate file
    if (!file || !file.name) {
      throw new Error('Invalid signature file');
    }
    
    // Create local file URL for preview
    const localURL = URL.createObjectURL(file);
    console.log('✅ Local signature URL created:', localURL);
    
    return localURL;
  } catch (error) {
    console.error('❌ Error processing signature:', error);
    throw new Error(`Signature processing failed: ${error.message}`);
  }
};

// File upload - LOCAL ONLY (no Firebase Storage to avoid CORS)
export const uploadFile = async (file, patentId, fileType) => {
  try {
    console.log('📁 Processing file locally:', file.name);
    
    // Validate file
    if (!file || !file.name) {
      throw new Error('Invalid file object');
    }
    
    // Create local file URL for preview
    const localURL = URL.createObjectURL(file);
    console.log('✅ Local file URL created:', localURL);
    
    return {
      name: file.name,
      url: localURL,
      type: fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      isLocal: true
    };
  } catch (error) {
    console.error('❌ Error processing file:', error);
    throw new Error(`File processing failed: ${error.message}`);
  }
};

// Author operations
export const saveAuthor = async (patentId, positionId, authorData) => {
  console.log('🔥 Saving author to localStorage:', patentId, positionId);
  
  const authorKey = `patent_${patentId}_authors`;
  const existingAuthors = JSON.parse(localStorage.getItem(authorKey) || '{}');
  existingAuthors[positionId] = authorData;
  localStorage.setItem(authorKey, JSON.stringify(existingAuthors));
  
  console.log('✅ Author saved to localStorage');
};

export const getAuthors = async (patentId) => {
  console.log('🔥 Getting authors from localStorage:', patentId);
  const authorKey = `patent_${patentId}_authors`;
  const authors = JSON.parse(localStorage.getItem(authorKey) || '{}');
  console.log('✅ Retrieved authors from localStorage');
  return authors;
};