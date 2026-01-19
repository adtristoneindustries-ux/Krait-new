import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { storage, formatDate } from '../utils/helpers.jsx';

const Home = () => {
  const [patents, setPatents] = useState([]);
  const [filteredPatents, setFilteredPatents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPatents();
  }, []);

  const loadPatents = async () => {
    try {
      const savedPatents = await storage.getPatents();
      setPatents(savedPatents);
      setFilteredPatents(savedPatents);
    } catch (error) {
      console.error('Error loading patents:', error);
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

  const handlePatentClick = (patent) => {
    navigate(`/patent-details/${patent.id}`, { state: { patent } });
  };

  const handleServiceClick = (service) => {
    switch (service) {
      case 'design-patent':
        navigate('/design-patent');
        break;
      case 'utility-patent':
        // Navigate to utility patent page when implemented
        break;
      case 'book-publishing':
        // Navigate to book publishing page when implemented
        break;
      case 'journal-papers':
        // Navigate to journal papers page when implemented
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <Navbar showSearch={true} onSearch={handleSearch} searchQuery={searchQuery} />
      
      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">Manage Your Intellectual Property</h1>
          <p className="hero-subtitle">Streamline your patent and publishing workflow</p>
        </div>

        <div className="services-container">
          <div className="service-card" onClick={() => handleServiceClick('design-patent')}>
            <div className="card-icon">
              <i className="fas fa-palette"></i>
            </div>
            <h3>Design Patent</h3>
            <p>Protect your unique designs and visual elements</p>
            <div className="card-overlay">
              <span>Explore Design Patents</span>
            </div>
          </div>

          <div className="service-card" onClick={() => handleServiceClick('utility-patent')}>
            <div className="card-icon">
              <i className="fas fa-cogs"></i>
            </div>
            <h3>Utility Patent</h3>
            <p>Secure your functional innovations and processes</p>
            <div className="card-overlay">
              <span>Explore Utility Patents</span>
            </div>
          </div>

          <div className="service-card" onClick={() => handleServiceClick('book-publishing')}>
            <div className="card-icon">
              <i className="fas fa-book"></i>
            </div>
            <h3>Book Publishing</h3>
            <p>Publish and manage your literary works</p>
            <div className="card-overlay">
              <span>Explore Publishing</span>
            </div>
          </div>

          <div className="service-card" onClick={() => handleServiceClick('journal-papers')}>
            <div className="card-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3>Journal Papers</h3>
            <p>Submit and track your research publications</p>
            <div className="card-overlay">
              <span>Explore Journals</span>
            </div>
          </div>
        </div>

        {searchQuery && (
          <div className="search-results-section">
            <h2 className="section-title">Search Results ({filteredPatents.length} found)</h2>
            <div className="patent-list">
              {filteredPatents.length === 0 ? (
                <div className="no-patents">
                  <i className="fas fa-search"></i>
                  <p>No patents match your search.</p>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;