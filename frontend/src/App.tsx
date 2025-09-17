import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MonasteryDetail from './pages/MonasteryDetail';
import Events from './pages/Events';
import Archives from './pages/Archives';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/monastery/:id" element={<MonasteryDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/archives" element={<Archives />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
