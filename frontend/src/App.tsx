import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddMonastery from './pages/AddMonastery';
import MonasteryDetail from './pages/MonasteryDetail';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-monastery" element={<AddMonastery />} />
        <Route path="/monastery/:id" element={<MonasteryDetail />} />
      </Routes>
    </Router>
  );
}