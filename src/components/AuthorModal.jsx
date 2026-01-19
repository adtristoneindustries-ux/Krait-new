import React, { useState, useEffect, useRef } from 'react';
import { validateEmail, validateMobile, storage } from '../utils/helpers.jsx';

const AuthorModal = ({ isOpen, onClose, onSave, author = null, positionId, patentId }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    college: '',
    email: '',
    mobile: '',
    signature: null
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (author) {
      setFormData(author);
    } else {
      setFormData({
        name: '',
        department: '',
        designation: '',
        college: '',
        email: '',
        mobile: '',
        signature: null
      });
    }
  }, [author, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const authorId = `${positionId}_${Date.now()}`;
        const downloadURL = await storage.uploadSignature(file, authorId);
        setFormData(prev => ({ ...prev, signature: downloadURL }));
      } catch (error) {
        console.error('Error uploading signature:', error);
        alert('Error uploading signature. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    const { name, department, designation, college, email, mobile } = formData;
    
    if (!name || !department || !designation || !college || !email || !mobile) {
      alert('Please fill all required fields');
      return;
    }
    
    // Email validation
    if (!validateEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Mobile validation
    if (!validateMobile(mobile)) {
      alert('Please enter exactly 10 digits for mobile number');
      return;
    }
    

    // Save author (no try-catch needed as storage.saveAuthor handles errors internally)
    await storage.saveAuthor(patentId || 'temp', positionId, formData);
    onSave(formData, positionId);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      department: '',
      designation: '',
      college: '',
      email: '',
      mobile: '',
      signature: null
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={handleClose}>
      <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Author Details</h3>
          <button className="close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="author-form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter full name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                placeholder="Enter department"
                className="form-input"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <input
                type="text"
                id="designation"
                name="designation"
                placeholder="Enter designation"
                className="form-input"
                value={formData.designation}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="college">College/Institution</label>
              <input
                type="text"
                id="college"
                name="college"
                placeholder="Enter college name"
                className="form-input"
                value={formData.college}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email ID</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="Enter 10-digit mobile number"
                className="form-input"
                maxLength="10"
                value={formData.mobile}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group signature-form-group">
              <label>Signature</label>
              <div className="signature-container">
                <div className="signature-upload-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="upload-signature-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-image"></i> Choose Signature Image
                  </button>
                </div>
                
                {formData.signature && (
                  <div className="signature-preview">
                    <img src={formData.signature} alt="Signature" className="signature-image" />
                    <button 
                      type="button" 
                      className="remove-signature-btn"
                      onClick={() => setFormData(prev => ({ ...prev, signature: null }))}
                    >
                      <i className="fas fa-times"></i> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorModal;