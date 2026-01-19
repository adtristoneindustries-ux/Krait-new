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
      
      // Get patent from storage (handles both Firebase and localStorage)
      const currentPatent = await storage.getPatent(id);
      
      if (currentPatent) {
        console.log('Patent found:', currentPatent);
        setPatent(currentPatent);
        
        // Load saved details (try Firebase first, then localStorage)
        if (currentPatent.details) {
          if (currentPatent.details.positions) {
            setPositions(currentPatent.details.positions);
            const maxId = Math.max(...currentPatent.details.positions.map(p => p.id));
            setPositionCounter(maxId);
          }
          if (currentPatent.details.files) {
            setUploadedFiles(currentPatent.details.files);
          }
        } else {
          // Fallback to localStorage for details
          const savedDetails = JSON.parse(localStorage.getItem(`patent_${id}_details`) || '{}');
          if (savedDetails.positions) {
            setPositions(savedDetails.positions);
            const maxId = Math.max(...savedDetails.positions.map(p => p.id));
            setPositionCounter(maxId);
          }
          if (savedDetails.files) {
            setUploadedFiles(savedDetails.files);
          }
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

  const handleSaveAuthor = (authorData, positionId) => {
    setPositions(positions.map(p => 
      p.id === positionId ? { ...p, author: authorData } : p
    ));
    showNotification('Author details saved successfully!');
  };

  const handleFileUpload = async (inputId, files) => {
    if (files.length === 0) return;
    
    try {
      showNotification('Processing files...', 'info');
      
      const uploadPromises = Array.from(files).map(file => 
        storage.uploadFile(file, id, inputId)
      );
      
      const uploadedFileResults = await Promise.all(uploadPromises);
      
      // Update local state
      setUploadedFiles(prev => ({
        ...prev,
        [inputId]: uploadedFileResults
      }));
      
      // Save to database
      const updatedPatentDetails = {
        files: {
          ...uploadedFiles,
          [inputId]: uploadedFileResults
        },
        positions: positions
      };
      
      try {
        await storage.updatePatent(id, { details: updatedPatentDetails });
        alert(`✅ SUCCESS: ${files.length} file(s) processed and saved successfully!`);
        showNotification(`${files.length} file(s) processed and saved!`);
      } catch (dbError) {
        console.log('Database save failed, using localStorage:', dbError);
        localStorage.setItem(`patent_${id}_details`, JSON.stringify(updatedPatentDetails));
        alert(`✅ SUCCESS: ${files.length} file(s) processed and saved locally!`);
        showNotification('Files processed and saved locally!', 'success');
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      alert(`❌ ERROR: Failed to process files - ${error.message}`);
      showNotification('Error processing files', 'error');
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

  const handleDeleteFile = (inputId) => {
    if (window.confirm('Are you sure you want to delete the uploaded files?')) {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[inputId];
        return newFiles;
      });
      showNotification('Files deleted successfully!');
    }
  };

  const handleSaveAllChanges = async () => {
    try {
      const patentDetails = {
        files: uploadedFiles,
        positions: positions
      };
      
      // Try Firebase first, fallback to localStorage
      try {
        await storage.updatePatent(id, { details: patentDetails });
        showNotification('All changes saved successfully!');
      } catch (error) {
        console.log('Firebase save failed, using localStorage:', error);
        localStorage.setItem(`patent_${id}_details`, JSON.stringify(patentDetails));
        showNotification('Changes saved locally!');
      }
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
              <i className="fas fa-check-circle"></i>
              {files.length} file(s) uploaded
            </div>
            <div className="file-list" style={{ marginTop: '0.5rem' }}>
              {files.map((file, index) => (
                <div key={index} className="file-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.25rem 0',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="view-btn" 
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="file-actions" style={{ display: 'flex', marginTop: '0.5rem' }}>
              <button className="delete-btn" onClick={() => handleDeleteFile(id)}>Delete All</button>
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