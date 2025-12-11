import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage'; // Assuming AuthPage.js is in the same directory
import DistanceCalculator from './DistanceCalculator';
import HistoricalQueries from './HistoricalQueries';

const App = () => {
  return (
    // 1. BrowserRouter manages the history and URLs
    <BrowserRouter>
      <Routes>
        {/* 2. Define the Route */}
        <Route 
          path="/" 
          element={<AuthPage />} 
        />
        
        {/* You can add other routes here, e.g., for the distance calculator */}
        <Route 
          path="/calculator" 
          element={<DistanceCalculator />} 
        />
        <Route 
          path="/history" 
          element={<HistoricalQueries />} 
        />
        
        {/* Optional: Add a catch-all route for 404 pages */}
        <Route 
          path="*" 
          element={<h1>404 Not Found</h1>} 
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;