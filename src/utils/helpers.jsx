import { 
  getPatents as getFirebasePatents, 
  addPatent as addFirebasePatent,
  updatePatent as updateFirebasePatent,
  deletePatent as deleteFirebasePatent,
  getPatent as getFirebasePatent,
  uploadFile as uploadFirebaseFile,
  uploadSignature as uploadFirebaseSignature,
  saveAuthor as saveFirebaseAuthor,
  getAuthors as getFirebaseAuthors
} from '../firebase/firestoreOnly';

// Notification utility
export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  let bgColor;
  
  switch(type) {
    case 'error':
      bgColor = '#e74c3c';
      break;
    case 'warning':
      bgColor = '#f39c12';
      break;
    case 'info':
      bgColor = '#3498db';
      break;
    default:
      bgColor = 'linear-gradient(135deg, #667eea, #764ba2)';
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 1rem 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 3000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

// Firebase Storage utilities - Firebase ONLY
export const storage = {
  getPatents: async () => {
    try {
      return await getFirebasePatents();
    } catch (error) {
      console.error('Firebase getPatents error:', error);
      throw new Error('Failed to load patents from Firebase');
    }
  },
  
  addPatent: async (patentData) => {
    try {
      return await addFirebasePatent(patentData);
    } catch (error) {
      console.error('Firebase addPatent error:', error);
      throw new Error('Failed to save patent to Firebase');
    }
  },
  
  updatePatent: async (patentId, patentData) => {
    try {
      return await updateFirebasePatent(patentId, patentData);
    } catch (error) {
      console.error('Firebase updatePatent error:', error);
      throw new Error('Failed to update patent in Firebase');
    }
  },
  
  deletePatent: async (patentId) => {
    try {
      await deleteFirebasePatent(patentId);
    } catch (error) {
      console.error('Firebase deletePatent error:', error);
      throw new Error('Failed to delete patent from Firebase');
    }
  },
  
  getPatent: async (patentId) => {
    try {
      return await getFirebasePatent(patentId);
    } catch (error) {
      console.error('Firebase getPatent error:', error);
      throw new Error('Failed to load patent from Firebase');
    }
  },
  
  saveAuthor: async (patentId, positionId, authorData) => {
    try {
      console.log('Saving author data:', authorData);
      return await saveFirebaseAuthor(patentId, positionId, authorData);
    } catch (error) {
      console.error('Firebase saveAuthor error:', error);
      throw new Error('Failed to save author to Firebase');
    }
  },
  
  uploadFile: async (file, patentTitle, fileType) => {
    try {
      return await uploadFirebaseFile(file, patentTitle, fileType);
    } catch (error) {
      console.error('Firebase uploadFile error:', error);
      throw new Error('Failed to upload file to Firebase');
    }
  },
  
  uploadSignature: async (file, patentTitle, positionNo) => {
    try {
      return await uploadFirebaseSignature(file, patentTitle, positionNo);
    } catch (error) {
      console.error('Firebase uploadSignature error:', error);
      throw new Error('Failed to upload signature to Firebase');
    }
  },
  
  getPatentFiles: async (patentId) => {
    // Return files from patent data instead of separate collection
    const patent = await getFirebasePatent(patentId);
    if (!patent) return {};
    
    const files = {};
    ['form1', 'form21', 'representationSheet', 'form21Stamp', 'document1', 'document2', 'document3'].forEach(fileType => {
      if (patent[fileType]) {
        files[fileType] = [patent[fileType]];
      }
    });
    return files;
  },
  
  savePosition: async (patentId, positionData) => {
    // Position data handled in patent details
    return true;
  },
  
  getPatentPositions: async (patentId) => {
    const patent = await getFirebasePatent(patentId);
    return patent?.positions || [];
  },
  
  getAuthors: async (patentId) => {
    try {
      return await getFirebaseAuthors(patentId);
    } catch (error) {
      console.error('Firebase getAuthors error:', error);
      return {};
    }
  },
  
  getAuthor: async (authorId) => {
    try {
      const parts = authorId.split('_');
      if (parts.length < 2) return null;
      
      const patentId = parts[0];
      const positionId = parts[1];
      const authors = await getFirebaseAuthors(patentId);
      return authors[positionId] || null;
    } catch (error) {
      console.error('Firebase getAuthor error:', error);
      return null;
    }
  }
};

// Date formatting utility
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validation utilities
export const validateEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

export const validateMobile = (mobile) => {
  const mobilePattern = /^[0-9]{10}$/;
  return mobilePattern.test(mobile);
};

// File utilities
export const createFileURL = (file) => {
  return URL.createObjectURL(file);
};

export const revokeFileURL = (url) => {
  URL.revokeObjectURL(url);
};