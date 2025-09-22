import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200" style={{ fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-gray-900">
            <span className="inline-block w-8 h-8 rounded bg-indigo-600" />
            <span className="text-lg font-semibold tracking-tight">Monastery360</span>
          </NavLink>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/" className={({ isActive }) => `hover:text-gray-900 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>Home</NavLink>
            <NavLink to="/map" className={({ isActive }) => `hover:text-gray-900 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>Map</NavLink>
            <NavLink to="/events" className={({ isActive }) => `hover:text-gray-900 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>Events</NavLink>
            <NavLink to="/archives" className={({ isActive }) => `hover:text-gray-900 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>Archives</NavLink>
            <NavLink to="/add" className={({ isActive }) => `px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 ${isActive ? 'ring-2 ring-indigo-300' : ''}`}>Add</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}


