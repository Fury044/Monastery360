import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MonasteryDetail from './pages/MonasteryDetail';
import Events from './pages/Events';
import Archives from './pages/Archives';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/MapPage" element={<Navigate to="/map" replace />} />
          <Route path="/monastery/:id" element={<MonasteryDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
