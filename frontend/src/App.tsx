import React from 'react';
  import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
  import Home from './pages/Home';
  import LandingHome from './pages/LandingHome';
  import TourLanding from './pages/TourLanding';
  import AddMonastery from './pages/AddMonastery';
  import MonasteryDetail from './pages/MonasteryDetail';
  import Navbar from './components/Navbar';
  import MapPage from './pages/Map';
  import EventsPage from './pages/Events';
  import ArchivesPage from './pages/Archives';

function AppShell() {
  const location = useLocation();
  const p = location.pathname;
  const hideNavbar = p === '/' || p === '/landing-home' || p.startsWith('/tour');
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingHome />} />
        <Route path="/tour" element={<TourLanding />} />
        <Route path="/landing-home" element={<LandingHome />} />
        <Route path="/app-home" element={<Home />} />
        <Route path="/add-monastery" element={<AddMonastery />} />
        <Route path="/monastery/:id" element={<MonasteryDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}