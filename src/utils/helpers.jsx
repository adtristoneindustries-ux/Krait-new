import { 
  getPatents as getFirebasePatents, 
  addPatent as addFirebasePatent,
  updatePatent as updateFirebasePatent,
  deletePatent as deleteFirebasePatent,
  getPatent as getFirebasePatent,
  uploadSignature,
  uploadFile,
  saveAuthor as saveFirebaseAuthor,
  getAuthors as getFirebaseAuthors
} from '../firebase/services';

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
    return await getFirebasePatents();
  },
  
  addPatent: async (patentData) => {
    return await addFirebasePatent(patentData);
  },
  
  updatePatent: async (patentId, patentData) => {
    return await updateFirebasePatent(patentId, patentData);
  },
  
  deletePatent: async (patentId) => {
    await deleteFirebasePatent(patentId);
  },
  
  getPatent: async (patentId) => {
    return await getFirebasePatent(patentId);
  },
  
  saveAuthor: async (patentId, positionId, authorData) => {
    await saveFirebaseAuthor(patentId, positionId, authorData);
  },
  
  getAuthors: async (patentId) => {
    return await getFirebaseAuthors(patentId);
  },
  
  uploadSignature: async (file, authorId) => {
    return await uploadSignature(file, authorId);
  },
  
  uploadFile: async (file, patentId, fileType) => {
    return await uploadFile(file, patentId, fileType);
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