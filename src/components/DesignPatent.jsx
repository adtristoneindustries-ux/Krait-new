import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import PatentModal from './PatentModal.jsx';
import { showNotification, storage, formatDate } from '../utils/helpers.jsx';
import { testFirebaseConnection } from '../firebase/test.js';

const DesignPatent = () => {
  const [patents, setPatents] = useState([]);
  const [filteredPatents, setFilteredPatents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatent, setEditingPatent] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatents();
    // Test Firebase connection
    testFirebaseConnection();
  }, []);

  const loadPatents = async () => {
    try {
      setLoading(true);
      const savedPatents = await storage.getPatents();
      savedPatents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPatents(savedPatents);
      setFilteredPatents(savedPatents);
    } catch (error) {
      console.error('Error loading patents:', error);
      showNotification('Error loading patents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPatents(patents);
    } else {
      const filtered = patents.filter(patent =>
        patent.title.toLowerCase().includes(query.toLowerCase()) ||
        patent.status.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPatents(filtered);
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [patents]);

  const handleAddPatent = () => {
    setEditingPatent(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleEditPatent = (patent) => {
    setEditingPatent(patent);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSavePatent = async (patentData) => {
    try {
      console.log('💾 Saving patent:', patentData);
      
      if (isEdit && editingPatent) {
        // Update existing patent
        console.log('📝 Updating patent ID:', editingPatent.id);
        const result = await storage.updatePatent(editingPatent.id, patentData);
        console.log('✅ Patent updated:', result);
        showNotification('Patent updated successfully!');
      } else {
        // Add new patent
        console.log('➕ Adding new patent');
        const result = await storage.addPatent(patentData);
        console.log('✅ Patent created:', result);
        showNotification('Patent created successfully!');
      }
      
      await loadPatents();
      setIsModalOpen(false);
    } catch (error) {
      console.error('❌ Error saving patent:', error);
      showNotification('Error saving patent: ' + error.message, 'error');
    }
  };

  const handleDeletePatent = async (id) => {
    if (window.confirm('Are you sure you want to delete this patent?')) {
      try {
        await storage.deletePatent(id);
        loadPatents();
        showNotification('Patent deleted successfully!');
      } catch (error) {
        console.error('Error deleting patent:', error);
        showNotification('Error deleting patent', 'error');
      }
    }
  };

  const handlePatentClick = (patent) => {
    navigate(`/patent-details/${patent.id}`, { state: { patent } });
  };



  return (
    <div>
      <Navbar onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="back-button-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i>
          Home
        </button>
      </div>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Design Patents</h1>
          <button className="add-btn" onClick={handleAddPatent}>
            <i className="fas fa-plus"></i>
            Add New Patent
          </button>
        </div>

        <div className="section">
          <h2 className="section-title">Patents {searchQuery && `(${filteredPatents.length} found)`}</h2>
          {loading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading patents...</p>
            </div>
          ) : (
            <div className="patent-list">
              {filteredPatents.length === 0 ? (
                <div className="no-patents">
                  <i className="fas fa-folder-open"></i>
                  <p>{searchQuery ? 'No patents match your search.' : 'No patents found. Create your first patent!'}</p>
                </div>
              ) : (
                filteredPatents.map((patent) => (
                  <div key={patent.id} className="patent-item">
                    <div className="patent-info">
                      <div 
                        className="patent-title" 
                        onClick={() => handlePatentClick(patent)}
                      >
                        {patent.title}
                      </div>
                      <div className="patent-date">
                        <i className="fas fa-calendar-alt"></i>
                        Created: {formatDate(patent.createdAt)}
                      </div>
                    </div>
                    <div className="patent-actions">
                      <div className="patent-status">{patent.status}</div>
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEditPatent(patent)}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeletePatent(patent.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <PatentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatent}
        patent={editingPatent}
        isEdit={isEdit}
      />
    </div>
  );
};

export default DesignPatent;