import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import DesignPatent from './components/DesignPatent.jsx';
import PatentDetails from './components/PatentDetails.jsx';
import PatentRowNavigation from './components/PatentRowNavigation.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/design-patent" element={<DesignPatent />} />
          <Route path="/patent-details/:id" element={<PatentDetails />} />
          <Route path="/patent-navigation" element={<PatentRowNavigation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;