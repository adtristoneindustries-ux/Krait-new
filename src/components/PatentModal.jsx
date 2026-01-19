import React, { useState, useEffect } from 'react';

const PatentModal = ({ isOpen, onClose, onSave, patent = null, isEdit = false }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('under booking');

  useEffect(() => {
    if (patent && isEdit) {
      setTitle(patent.title);
      setStatus(patent.status);
    } else {
      setTitle('');
      setStatus('under booking');
    }
  }, [patent, isEdit, isOpen]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a patent title');
      return;
    }

    onSave({
      title: title.trim(),
      status
    });

    setTitle('');
    setStatus('under booking');
  };

  const handleClose = () => {
    setTitle('');
    setStatus('under booking');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Design Patent' : 'Create New Design Patent'}</h3>
          <button className="close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="patentTitle">Patent Title</label>
            <input
              type="text"
              id="patentTitle"
              placeholder="Enter patent title..."
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="patentStatus">Status</label>
            <select
              id="patentStatus"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="under booking">Under Booking</option>
              <option value="booking">Booking</option>
              <option value="under file">Under File</option>
              <option value="filed">Filed</option>
              <option value="FER">FER</option>
              <option value="SER">SER</option>
              <option value="grant">Grant</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatentModal;