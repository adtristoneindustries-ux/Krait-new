import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ showSearch = true, onSearch, searchQuery: externalSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const navigate = useNavigate();

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={handleLogoClick}>
          <img src="/images/Kraitlogonew.png" alt="Krait Logo" className="logo-img" />
        </div>
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Search patents..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;