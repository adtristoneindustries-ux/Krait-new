import React, { useState, useEffect } from 'react';
import { storage } from '../utils/helpers.jsx';

const PatentRowNavigation = () => {
  const [patents, setPatents] = useState([]);
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [patentDetails, setPatentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatents();
  }, []);

  const loadPatents = async () => {
    try {
      const patentList = await storage.getPatents();
      setPatents(patentList);
    } catch (error) {
      console.error('Error loading patents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatentClick = (patent) => {
    setSelectedPatent(patent);
    setPatentDetails(null); // Clear details when selecting new patent
  };

  const handleTitleClick = async (patent) => {
    try {
      console.log('Loading details for patent:', patent.id);
      const details = await storage.getPatent(patent.id);
      const authors = await storage.getAuthors(patent.id);
      console.log('Patent details:', details);
      console.log('Authors data:', authors);
      setPatentDetails({ ...details, authors });
    } catch (error) {
      console.error('Error loading patent details:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading patents...</div>;
  }

  return (
    <div className="patent-row-navigation">
      {/* Row 1: Patents List */}
      <div className="navigation-row patents-row">
        <h3>Patents</h3>
        <div className="row-content">
          {patents.map(patent => (
            <div 
              key={patent.id}
              className={`patent-card ${selectedPatent?.id === patent.id ? 'selected' : ''}`}
              onClick={() => handlePatentClick(patent)}
            >
              <div className="patent-title">{patent.title}</div>
              <div className="patent-status">{patent.status}</div>
              <div className="patent-date">{new Date(patent.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Patent Title Details */}
      {selectedPatent && (
        <div className="navigation-row title-row">
          <h3>Selected Patent</h3>
          <div className="row-content">
            <div 
              className="title-card"
              onClick={() => handleTitleClick(selectedPatent)}
            >
              <div className="title-main">{selectedPatent.title}</div>
              <div className="title-info">
                <span>Status: {selectedPatent.status}</span>
                <span>Created: {new Date(selectedPatent.createdAt).toLocaleDateString()}</span>
                <span className="click-hint">Click to view details</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Complete Patent Details */}
      {patentDetails && (
        <div className="navigation-row details-row">
          <h3>Patent Details</h3>
          <div className="row-content">
            <div className="details-grid">
              {/* Basic Info */}
              <div className="detail-card">
                <h4>Basic Information</h4>
                <p><strong>Title:</strong> {patentDetails.title}</p>
                <p><strong>Status:</strong> {patentDetails.status}</p>
                <p><strong>Created:</strong> {new Date(patentDetails.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Documents */}
              <div className="detail-card">
                <h4>Documents</h4>
                {patentDetails.form1 && <p>✓ Form 1</p>}
                {patentDetails.form21 && <p>✓ Form 21</p>}
                {patentDetails.representationSheet && <p>✓ Representation Sheet</p>}
                {patentDetails.form21Stamp && <p>✓ Form 21 Stamp</p>}
                {patentDetails.documents?.document1 && <p>✓ Document 1</p>}
                {patentDetails.documents?.document2 && <p>✓ Document 2</p>}
                {patentDetails.documents?.document3 && <p>✓ Document 3</p>}
              </div>

              {/* Authors */}
              {patentDetails.authors && Object.keys(patentDetails.authors).length > 0 ? (
                <div className="detail-card authors-card">
                  <h4>Authors & Positions</h4>
                  {Object.entries(patentDetails.authors).map(([positionId, author]) => (
                    <div key={positionId} className="author-item">
                      <p><strong>Position {positionId}:</strong> {author.fullName || author.name || 'No name'}</p>
                      <p>Department: {author.department || 'Not specified'}</p>
                      <p>Designation: {author.designation || 'Not specified'}</p>
                      <p>College: {author.college || 'Not specified'}</p>
                      <p>Email: {author.email || 'Not specified'}</p>
                      <p>Mobile: {author.mobile || 'Not specified'}</p>
                      <p>Amount: ₹{author.amount || '0'}</p>
                      <p>Pending: ₹{author.pendingAmount || '0'}</p>
                      {author.signatureUrl && <p>✓ Signature uploaded</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="detail-card">
                  <h4>Authors & Positions</h4>
                  <p>No authors added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .patent-row-navigation {
          padding: 1rem;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .navigation-row {
          margin-bottom: 2rem;
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .navigation-row h3 {
          margin: 0 0 1rem 0;
          color: #333;
          border-bottom: 3px solid #667eea;
          padding-bottom: 0.5rem;
          font-size: 1.3rem;
        }

        .row-content {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .patent-card {
          min-width: 250px;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f9f9f9;
        }

        .patent-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .patent-card.selected {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: #667eea;
        }

        .patent-title {
          font-weight: bold;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .patent-status {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .patent-date {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .title-card {
          width: 100%;
          padding: 1.5rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #f8f9ff, #e8f0ff);
        }

        .title-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
          border-color: #667eea;
        }

        .title-main {
          font-size: 1.4rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 1rem;
        }

        .title-info span {
          display: inline-block;
          margin-right: 1.5rem;
          color: #666;
          font-size: 0.95rem;
        }

        .click-hint {
          color: #667eea !important;
          font-weight: 500;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-card {
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background: #f9f9f9;
        }

        .detail-card h4 {
          margin: 0 0 1rem 0;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .detail-card p {
          margin: 0.5rem 0;
          color: #555;
          line-height: 1.5;
        }

        .authors-card {
          grid-column: 1 / -1;
        }

        .author-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 4px solid #667eea;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
          
          .row-content {
            flex-direction: column;
          }
          
          .patent-card {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PatentRowNavigation;