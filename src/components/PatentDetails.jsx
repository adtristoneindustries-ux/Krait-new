import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import AuthorModal from './AuthorModal.jsx';
import { showNotification, storage } from '../utils/helpers.jsx';

const PatentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patent, setPatent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([{ id: 1, positionNumber: 1, amount: '', pendingAmount: '', author: null }]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [currentPositionId, setCurrentPositionId] = useState(null);
  const [positionCounter, setPositionCounter] = useState(1);

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
          form21Stamp: currentPatent.form21Stamp ? [currentPatent.form21Stamp] : [],
          document1: currentPatent.document1 ? [currentPatent.document1] : [],
          document2: currentPatent.document2 ? [currentPatent.document2] : [],
          document3: currentPatent.document3 ? [currentPatent.document3] : []
        };
        setUploadedFiles(files);
        
        // Load authors and positions
        const authors = await storage.getAuthors(id);
        const positionsWithAuthors = currentPatent.positions?.map((pos, index) => ({
          id: index + 1,
          positionNumber: pos.positionNo || index + 1,
          amount: authors[index + 1]?.amount || '',
          pendingAmount: authors[index + 1]?.pendingAmount || '',
          author: authors[index + 1] ? {
            name: authors[index + 1].fullName,
            department: authors[index + 1].department,
            designation: authors[index + 1].designation,
            college: authors[index + 1].college,
            email: authors[index + 1].email,
            mobile: authors[index + 1].mobile,
            signature: authors[index + 1].signatureUrl,
            signatureFileName: authors[index + 1].signatureFileName
          } : null
        })) || [{ id: 1, positionNumber: 1, amount: '', pendingAmount: '', author: null }];
        
        setPositions(positionsWithAuthors);
        setPositionCounter(positionsWithAuthors.length);
      } else {
        console.log('Patent not found with ID:', id);
      }
    } catch (error) {
      console.error('Error loading patent data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatentData();
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
    setPositions(positions.map(p => 
      p.id === positionId ? { ...p, [field]: value } : p
    ));
  };

  const handleAuthorClick = (positionId) => {
    setCurrentPositionId(positionId);
    setIsAuthorModalOpen(true);
  };

  const handleSaveAuthor = async (authorData, positionId) => {
    try {
      let signatureData = null;
      
      // Upload signature if provided
      if (authorData.signature && typeof authorData.signature !== 'string') {
        signatureData = await storage.uploadSignature(authorData.signature, positionId);
      }
      
      // Save author to Firebase
      await storage.saveAuthor(id, positionId, {
        fullName: authorData.name,
        department: authorData.department,
        designation: authorData.designation,
        college: authorData.college,
        email: authorData.email,
        mobile: authorData.mobile,
        signatureFileName: signatureData?.fileName || authorData.signatureFileName,
        signatureUrl: signatureData?.url || authorData.signature,
        amount: positions.find(p => p.id === positionId)?.amount || '',
        pendingAmount: positions.find(p => p.id === positionId)?.pendingAmount || ''
      });
      
      // Update local state
      setPositions(positions.map(p => 
        p.id === positionId ? { 
          ...p, 
          author: {
            ...authorData,
            signature: signatureData?.url || authorData.signature,
            signatureFileName: signatureData?.fileName || authorData.signatureFileName
          }
        } : p
      ));
      
      // Update patent with position info
      const updatedPositions = positions.map(p => 
        p.id === positionId ? { 
          positionNo: p.positionNumber,
          authorName: authorData.name
        } : {
          positionNo: p.positionNumber,
          authorName: p.author?.name || ''
        }
      );
      
      await storage.updatePatent(id, {
        ...patent,
        positions: updatedPositions
      });
      
      showNotification('Author details saved successfully!');
    } catch (error) {
      console.error('Error saving author:', error);
      showNotification('Error saving author details', 'error');
    }
  };

  const handleFileUpload = async (inputId, files) => {
    if (files.length === 0) return;
    
    try {
      showNotification('Uploading files...', 'info');
      
      // Upload files to Firebase Storage
      const uploadPromises = Array.from(files).map(file => 
        storage.uploadFile(file, patent.title, inputId)
      );
      
      const uploadedFileResults = await Promise.all(uploadPromises);
      
      // Replace existing files (not append)
      setUploadedFiles(prev => ({
        ...prev,
        [inputId]: uploadedFileResults
      }));
      
      // Update patent in Firebase with file details
      const updatedPatent = {
        ...patent,
        [inputId]: uploadedFileResults[0] // Store first file info
      };
      
      await storage.updatePatent(id, updatedPatent);
      setPatent(updatedPatent);
      
      showNotification(`${files.length} file(s) uploaded successfully!`);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification(`Error: ${error.message}`, 'error');
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
        // Update local state
        const updatedFiles = uploadedFiles[inputId]?.filter((_, index) => index !== fileIndex) || [];
        setUploadedFiles(prev => ({
          ...prev,
          [inputId]: updatedFiles
        }));
        
        // Update patent in Firebase
        const updatedPatent = {
          ...patent,
          [inputId]: updatedFiles.length > 0 ? updatedFiles[0] : null
        };
        
        await storage.updatePatent(id, updatedPatent);
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
      const positionPromises = positions.map(async (position) => {
        if (position.author) {
          await storage.saveAuthor(id, position.id, {
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
          });
        }
      });
      
      await Promise.all(positionPromises);
      
      // Update patent with all position info
      const updatedPositions = positions.map(p => ({
        positionNo: p.positionNumber,
        authorName: p.author?.name || ''
      }));
      
      await storage.updatePatent(id, {
        ...patent,
        positions: updatedPositions
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
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
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
            <FileUploadCard id="representation" title="Representation Sheet" accept=".pdf,.doc,.docx,.jpg,.png" />
            <FileUploadCard id="stamp" title="Form 21 Stamp" accept=".pdf,.jpg,.png" />
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
                    <span>{position.author ? position.author.name : 'Select Author'}</span>
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