import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import { updatePatent } from './firestoreOnly';

// Delete file from storage and update database
export const deleteFileFromPatent = async (patentId, patentTitle, fileType, fileName) => {
  try {
    // Delete from Firebase Storage
    const fileRef = ref(storage, `${patentTitle}/${fileType}/${fileName}`);
    await deleteObject(fileRef);
    
    // Update patent document to remove file reference
    const updateData = { [fileType]: null };
    await updatePatent(patentId, updateData);
    
    console.log('File deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Replace file in storage and update database
export const replaceFileInPatent = async (patentId, patentTitle, fileType, oldFileName, newFile) => {
  try {
    // Delete old file if exists
    if (oldFileName) {
      const oldFileRef = ref(storage, `${patentTitle}/${fileType}/${oldFileName}`);
      await deleteObject(oldFileRef).catch(() => console.log('Old file not found'));
    }
    
    // Upload new file
    const fileName = `${Date.now()}_${newFile.name}`;
    const fileRef = ref(storage, `${patentTitle}/${fileType}/${fileName}`);
    
    await uploadBytes(fileRef, newFile);
    const downloadURL = await getDownloadURL(fileRef);
    
    const fileData = {
      name: newFile.name,
      fileName: fileName,
      url: downloadURL,
      size: newFile.size,
      type: newFile.type,
      uploadedAt: new Date().toISOString()
    };
    
    // Update patent document
    const updateData = { [fileType]: fileData };
    await updatePatent(patentId, updateData);
    
    return fileData;
  } catch (error) {
    console.error('Error replacing file:', error);
    throw error;
  }
};