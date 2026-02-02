import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import AuthorModal from './AuthorModal.jsx';
import { showNotification, storage } from '../utils/helpers.jsx';
import { ref, deleteObject } from 'firebase/storage';
import { storage as firebaseStorage } from '../firebase/config';

const PatentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patent, setPatent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([{ id: 1, positionNumber: 1, amount: '', pendingAmount: '', author: null }]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [currentPositionId, setCurrentPositionId] = useState(null);
  const [allAuthors, setAllAuthors] = useState([]);

  const loadAllAuthors = async () => {
    try {
      const authors = await storage.getAuthors(id);
      const authorsList = Object.entries(authors).map(([positionId, authorData]) => ({
        id: positionId,
        name: authorData.fullName || authorData.name,
        department: authorData.department,
        designation: authorData.designation,
        college: authorData.college,
        email: authorData.email,
        mobile: authorData.mobile,
        amount: authorData.amount || '0',
        pendingAmount: authorData.pendingAmount || '0',
        signature: authorData.signatureUrl,
        signatureFileName: authorData.signatureFileName
      }));
      setAllAuthors(authorsList);
    } catch (error) {
      console.log('No authors found');
    }
  };

  const loadPatentData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading patent with ID:', id);
      
      const currentPatent = await storage.getPatent(id);
      
      if (currentPatent) {
        console.log('Patent found:', currentPatent);
        setPatent(currentPatent);
        
        // Load files from patent data
        const files = {
          form1: currentPatent.form1 ? [currentPatent.form1] : [],
          form21: currentPatent.form21 ? [currentPatent.form21] : [],
          representationSheet: currentPatent.representationSheet ? [currentPatent.representationSheet] : [],
          representation: currentPatent.representation ? [currentPatent.representation] : [],
          form21Stamp: currentPatent.form21Stamp ? [currentPatent.form21Stamp] : [],
          stamp: currentPatent.stamp ? [currentPatent.stamp] : [],
          document1: currentPatent.documents?.document1 ? [currentPatent.documents.document1] : [],
          document2: currentPatent.documents?.document2 ? [currentPatent.documents.document2] : [],
          document3: currentPatent.documents?.document3 ? [currentPatent.documents.document3] : [],
          doc1: currentPatent.doc1 ? [currentPatent.doc1] : [],
          doc2: currentPatent.doc2 ? [currentPatent.doc2] : [],
          doc3: currentPatent.doc3 ? [currentPatent.doc3] : []
        };
        setUploadedFiles(files);
        
        // Load authors and positions
        try {
          const authors = await storage.getAuthors(id);
          console.log('Loaded authors:', authors);
          
          if (Object.keys(authors).length > 0) {
            const positionsWithAuthors = Object.entries(authors).map(([positionId, authorData]) => ({
              id: parseInt(positionId),
              positionNumber: parseInt(positionId),
              amount: authorData.amount || '',
              pendingAmount: authorData.pendingAmount || '',
              author: {
                name: authorData.fullName || authorData.name,
                department: authorData.department,
                designation: authorData.designation,
                college: authorData.college,
                email: authorData.email,
                mobile: authorData.mobile,
                signature: authorData.signatureUrl,
                signatureFileName: authorData.signatureFileName
              }
            }));
            
            setPositions(positionsWithAuthors);
            setPositionCounter(Math.max(...positionsWithAuthors.map(p => p.id)));
          } else {
            setPositions([{ id: 1, positionNumber: 1, amount: '', pendingAmount: '', author: null }]);
            setPositionCounter(1);
          }
        } catch (authorError) {
          console.log('No authors found, using default position');
          setPositions([{ id: 1, positionNumber: 1, amount: '', pendingAmount: '', author: null }]);
          setPositionCounter(1);
        }
      } else {
        console.log('Patent not found with ID:', id);
      }
    } catch (error) {
      console.error('Error loading patent data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const [positionCounter, setPositionCounter] = useState(1);

  useEffect(() => {
    loadPatentData();
    loadAllAuthors();
  }, [loadPatentData]);

  const handleAddPosition = () => {
    const nextPositionNumber = Math.max(...positions.map(p => p.positionNumber || 0)) + 1;
    const newPosition = {
      id: positionCounter + 1,
      positionNumber: nextPositionNumber,
      amount: '',
      pendingAmount: '',
      author: null
    };
    
    setPositions([...positions, newPosition]);
    setPositionCounter(positionCounter + 1);
    showNotification('New position added!');
  };

  const handleDeletePosition = (positionId) => {
    if (positions.length > 1 && window.confirm('Are you sure you want to delete this position?')) {
      setPositions(positions.filter(p => p.id !== positionId));
      showNotification('Position deleted!');
    }
  };

  const handlePositionChange = (positionId, field, value) => {
    console.log(`Position ${positionId} ${field} changed to:`, value);
    
    setPositions(positions.map(p => 
      p.id === positionId ? { ...p, [field]: value } : p
    ));
    
    // Auto-save amount and pending amount to Firebase
    if (field === 'amount' || field === 'pendingAmount') {
      const position = positions.find(p => p.id === positionId);
      if (position?.author) {
        const authorToSave = {
          fullName: position.author.name,
          department: position.author.department,
          designation: position.author.designation,
          college: position.author.college,
          email: position.author.email,
          mobile: position.author.mobile,
          signatureFileName: position.author.signatureFileName || '',
          signatureUrl: position.author.signature || '',
          amount: field === 'amount' ? value : position.amount,
          pendingAmount: field === 'pendingAmount' ? value : position.pendingAmount
        };
        
        // Update patent with authors data
        storage.getPatent(id).then(currentPatent => {
          const updatedAuthors = {
            ...currentPatent.authors,
            [positionId]: authorToSave
          };
          
          return storage.updatePatent(id, {
            ...currentPatent,
            authors: updatedAuthors
          });
        }).then(() => {
          console.log('Amount saved successfully');
        }).catch(error => {
          console.error('Error saving amount:', error);
        });
      }
    }
  };

  const handleAuthorClick = (positionId) => {
    setCurrentPositionId(positionId);
    setIsAuthorModalOpen(true);
  };

  const handleSaveAuthor = async (authorData, positionId) => {
    try {
      console.log('Author data received:', authorData);
      console.log('Position ID:', positionId);
      
      let signatureData = null;
      
      // Upload signature if provided
      if (authorData.signature && typeof authorData.signature !== 'string') {
        console.log('Uploading signature with patent title:', patent.title);
        signatureData = await storage.uploadSignature(authorData.signature, patent.title, positionId);
        console.log('Signature uploaded to:', signatureData);
      }
      
      // Get current position data for amount and pending amount
      const currentPosition = positions.find(p => p.id === positionId);
      
      // Prepare author data with proper field names
      const authorToSave = {
        name: authorData.name || '',
        fullName: authorData.name || '',
        department: authorData.department || '',
        designation: authorData.designation || '',
        college: authorData.college || '',
        email: authorData.email || '',
        mobile: authorData.mobile || '',
        signatureFileName: signatureData?.fileName || authorData.signatureFileName || '',
        signatureUrl: signatureData?.url || authorData.signature || '',
        amount: currentPosition?.amount || '',
        pendingAmount: currentPosition?.pendingAmount || ''
      };
      
      console.log('Saving author with data:', authorToSave);
      
      // Save author to Firebase immediately
      const patentData = await storage.getPatent(id);
      const authorsData = {
        ...patentData.authors,
        [positionId]: {
          fullName: authorData.name,
          department: authorData.department,
          designation: authorData.designation,
          college: authorData.college,
          email: authorData.email,
          mobile: authorData.mobile,
          signatureFileName: signatureData?.fileName || authorData.signatureFileName || '',
          signatureUrl: signatureData?.url || authorData.signature || '',
          amount: currentPosition?.amount || '0',
          pendingAmount: currentPosition?.pendingAmount || '0'
        }
      };
      
      await storage.updatePatent(id, {
        ...patentData,
        authors: authorsData
      });
      
      // Update local state
      setPositions(positions.map(p => 
        p.id === positionId ? { 
          ...p, 
          author: {
            name: authorData.name,
            department: authorData.department,
            designation: authorData.designation,
            college: authorData.college,
            email: authorData.email,
            mobile: authorData.mobile,
            signature: signatureData?.url || authorData.signature,
            signatureFileName: signatureData?.fileName || authorData.signatureFileName
          }
        } : p
      ));
      
      // Update patent with position info and save authors
      const updatedPositions = positions.map(p => 
        p.id === positionId ? { 
          positionNo: p.positionNumber,
          authorName: authorData.name
        } : {
          positionNo: p.positionNumber,
          authorName: p.author?.name || ''
        }
      );
      
      // Get current patent data and update with authors
      const currentPatent = await storage.getPatent(id);
      const updatedAuthors = {
        ...currentPatent.authors,
        [positionId]: {
          fullName: authorData.name,
          department: authorData.department,
          designation: authorData.designation,
          college: authorData.college,
          email: authorData.email,
          mobile: authorData.mobile,
          signatureFileName: signatureData?.fileName || authorData.signatureFileName || '',
          signatureUrl: signatureData?.url || authorData.signature || '',
          amount: currentPosition?.amount || '0',
          pendingAmount: currentPosition?.pendingAmount || '0'
        }
      };
      
      await storage.updatePatent(id, {
        ...patent,
        positions: updatedPositions,
        authors: updatedAuthors
      });
      
      showNotification('Author details saved successfully!');
      
      // Reload all authors to update dropdown
      await loadAllAuthors();
    } catch (error) {
      console.error('Error saving author:', error);
      showNotification('Error saving author details', 'error');
    }
  };

  const handleFileDelete = async (inputId, fileIndex) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const fileToDelete = uploadedFiles[inputId][fileIndex];
        
        // Delete from Firebase Storage and Database
        const { deleteFileFromPatent } = await import('../firebase/fileManager');
        await deleteFileFromPatent(id, patent.title, inputId, fileToDelete.fileName);
        
        // Update local state
        setUploadedFiles(prev => ({
          ...prev,
          [inputId]: prev[inputId].filter((_, index) => index !== fileIndex)
        }));
        
        showNotification('File deleted successfully!');
      } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('Error deleting file', 'error');
      }
    }
  };

  const handleFileUpload = async (inputId, files) => {
    if (files.length === 0) return;
    
    try {
      showNotification('Uploading files...', 'info');
      
      const uploadPromises = Array.from(files).map(file => 
        storage.uploadFile(file, patent.title, inputId)
      );
      
      const uploadedFileData = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => ({
        ...prev,
        [inputId]: [...(prev[inputId] || []), ...uploadedFileData]
      }));
      
      // Update patent with file data and save to Firebase immediately
      console.log('Saving file for inputId:', inputId, 'File data:', uploadedFileData[0]);
      
      // Get current patent data first
      const currentPatent = await storage.getPatent(patent.title);
      const updateData = { 
        ...currentPatent,
        [inputId]: uploadedFileData[0] 
      };
      
      await storage.updatePatent(patent.title, updateData);
      setPatent(updateData);
      console.log('File saved to database for:', inputId);
      
      showNotification('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification('Error uploading files', 'error');
    }
  };

  const handleViewFile = (inputId) => {
    const files = uploadedFiles[inputId];
    if (!files || files.length === 0) {
      alert('No files uploaded');
      return;
    }
    
    if (files.length === 1) {
      window.open(files[0].url, '_blank');
    } else {
      let fileList = 'Select file to view:\n\n';
      files.forEach((file, index) => {
        fileList += `${index + 1}. ${file.name}\n`;
      });
      
      const selection = prompt(fileList + '\nEnter file number to view:');
      const fileIndex = parseInt(selection) - 1;
      
      if (fileIndex >= 0 && fileIndex < files.length) {
        window.open(files[fileIndex].url, '_blank');
      }
    }
  };

  const handleDeleteFile = async (inputId, fileIndex) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const fileToDelete = uploadedFiles[inputId][fileIndex];
        
        // Delete from Firebase Storage
        if (fileToDelete?.url) {
          try {
            const url = new URL(fileToDelete.url);
            const pathMatch = url.pathname.match(/o\/(.*?)\?/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              const fileRef = ref(firebaseStorage, filePath);
              await deleteObject(fileRef);
              console.log('File deleted from storage:', filePath);
            }
          } catch (storageError) {
            console.log('Storage deletion error:', storageError);
          }
        }
        
        // Update local state
        const currentFiles = uploadedFiles[inputId] || [];
        const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
        
        setUploadedFiles(prev => ({
          ...prev,
          [inputId]: updatedFiles
        }));
        
        // Update patent in Firebase Database
        const currentPatent = await storage.getPatent(patent.title);
        const updatedPatent = {
          ...currentPatent,
          [inputId]: updatedFiles.length > 0 ? updatedFiles[0] : null
        };
        
        await storage.updatePatent(patent.title, updatedPatent);
        setPatent(updatedPatent);
        
        showNotification('File deleted successfully!');
      } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('Error deleting file', 'error');
      }
    }
  };

  const handleSaveAllChanges = async () => {
    try {
      // Save all position and author data to Firebase
      const patentDoc = await storage.getPatent(id);
      const allAuthors = {};
      
      positions.forEach((position) => {
        if (position.author) {
          allAuthors[position.id] = {
            fullName: position.author.name,
            department: position.author.department,
            designation: position.author.designation,
            college: position.author.college,
            email: position.author.email,
            mobile: position.author.mobile,
            signatureFileName: position.author.signatureFileName,
            signatureUrl: position.author.signature,
            amount: position.amount,
            pendingAmount: position.pendingAmount
          };
        }
      });
      
      // Update patent with all position info and authors
      const updatedPositions = positions.map(p => ({
        positionNo: p.positionNumber,
        authorName: p.author?.name || ''
      }));
      
      await storage.updatePatent(id, {
        ...patentDoc,
        positions: updatedPositions,
        authors: allAuthors
      });
      
      showNotification('All changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      showNotification('Error saving changes', 'error');
    }
  };

  const handleCancelChanges = () => {
    if (window.confirm('Are you sure you want to cancel all changes? Unsaved changes will be lost.')) {
      loadPatentData();
      showNotification('Changes cancelled. Reverted to saved state.');
    }
  };



  const FileUploadCard = ({ id, title, accept = ".pdf,.doc,.docx" }) => {
    const files = uploadedFiles[id];
    const hasFiles = files && files.length > 0;

    return (
      <div className={`upload-card ${hasFiles ? 'uploaded' : ''}`}>
        <i className="fas fa-file-upload"></i>
        <h4>{title}</h4>
        <input
          type="file"
          id={id}
          accept={accept}
          multiple
          onChange={(e) => handleFileUpload(id, e.target.files)}
        />
        <label htmlFor={id} className="upload-btn">Upload</label>
        {hasFiles && (
          <>
            <div className="file-info" style={{ display: 'block' }}>
              {files.length} file(s) uploaded
            </div>
            <div className="file-list" style={{ marginTop: '0.5rem' }}>
              {files.map((file, index) => (
                <div key={index} className="file-item" style={{ 
                  padding: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      className="file-action-btn" 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name;
                        link.click();
                      }}
                      title="View file"
                      style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: '0', fontSize: '0.8rem' }}
                    >
                      <i className="fas fa-eye"></i> View
                    </button>
                    <button 
                      className="file-action-btn" 
                      onClick={() => handleDeleteFile(id, index)}
                      title="Delete file"
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0', fontSize: '0.8rem' }}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#667eea' }}></i>
          <p>Loading patent details...</p>
        </div>
      </div>
    );
  }

  if (!patent) {
    return (
      <div>
        <Navbar />
        <div className="no-patents" style={{ padding: '4rem', textAlign: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#e74c3c' }}></i>
          <p>Patent not found</p>
          <button className="btn btn-save" onClick={() => navigate('/design-patent')}>Back to Patents</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      <div className="back-button-container">
        <button className="back-btn" onClick={() => navigate('/design-patent')}>
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
      </div>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">{patent.title}</h1>
        </div>

        {/* Files Section */}
        <div className="section">
          <h2 className="section-title">Files</h2>
          <div className="upload-grid">
            <FileUploadCard id="form1" title="Form 1" />
            <FileUploadCard id="form21" title="Form 21" />
            <FileUploadCard id="form21Stamp" title="Form 21 Stamp" accept=".pdf,.jpg,.png" />
            <FileUploadCard id="representationSheet" title="Representation Sheet" accept=".pdf,.doc,.docx,.jpg,.png" />
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
            <h3 style={{ color: '#333', marginBottom: '1rem' }}>Other Documents</h3>
            <div className="upload-grid">
              <FileUploadCard id="doc1" title="Document 1" />
              <FileUploadCard id="doc2" title="Document 2" />
              <FileUploadCard id="doc3" title="Document 3" />
            </div>
          </div>
        </div>

        {/* Position Section */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Position</h2>
            <button className="add-btn" onClick={handleAddPosition}>
              <i className="fas fa-plus"></i>
              Add New Position
            </button>
          </div>
          
          {positions.map((position) => (
            <div key={position.id} className="position-form">
              {positions.length > 1 && (
                <button 
                  className="delete-position-btn" 
                  onClick={() => handleDeletePosition(position.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Position Number</label>
                  <input
                    type="number"
                    placeholder="Enter position number"
                    className="form-input"
                    min="1"
                    value={position.positionNumber}
                    onChange={(e) => handlePositionChange(position.id, 'positionNumber', parseInt(e.target.value) || '')}
                  />
                </div>
                <div className="form-group">
                  <label>Author Name</label>
                  <button 
                    className={`author-btn ${position.author ? 'filled' : ''}`}
                    onClick={() => handleAuthorClick(position.id)}
                  >
                    <span>{position.author ? `${position.author.name} - ${position.author.department}` : 'Select Author'}</span>
                    <i className="fas fa-user-plus"></i>
                  </button>
                </div>
                <div className="form-group">
                  <label>Amount ₹</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="form-input"
                    min="0"
                    value={position.amount}
                    onChange={(e) => handlePositionChange(position.id, 'amount', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Pending Amount ₹</label>
                  <input
                    type="number"
                    placeholder="Enter pending amount"
                    className="form-input"
                    min="0"
                    value={position.pendingAmount}
                    onChange={(e) => handlePositionChange(position.id, 'pendingAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Save/Cancel Buttons */}
        <div className="action-buttons">
          <button className="btn btn-cancel" onClick={handleCancelChanges}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSaveAllChanges}>
            Save All Changes
          </button>
        </div>
      </main>

      <AuthorModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onSave={handleSaveAuthor}
        author={positions.find(p => p.id === currentPositionId)?.author}
        positionId={currentPositionId}
        patentId={id}
      />
    </div>
  );
};


export default PatentDetails;