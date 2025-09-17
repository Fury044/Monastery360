import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-10" style={{ fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' }}>
      <div className="w-full h-[152px] relative">
        <div className="w-full h-[152px] left-0 top-0 absolute bg-[#D9D9D9]" />
        <div className="absolute" style={{ left: 61, top: 47, color: '#1E1E1E', fontSize: 48, fontWeight: 400 }}>
          LOGO
        </div>
        <NavLink to="/" className="absolute" style={{ left: 582, top: 56, color: '#1E1E1E', fontSize: 32, fontWeight: 400 }}>
          Home
        </NavLink>
        <NavLink to="/map" className="absolute" style={{ left: 795, top: 56, color: '#1E1E1E', fontSize: 32, fontWeight: 400 }}>
          Map
        </NavLink>
        <NavLink to="/events" className="absolute" style={{ left: 1003, top: 56, color: '#1E1E1E', fontSize: 32, fontWeight: 400 }}>
          Events
        </NavLink>
        <NavLink to="/archives" className="absolute" style={{ left: 1182, top: 56, color: '#1E1E1E', fontSize: 32, fontWeight: 400 }}>
          Archieves
        </NavLink>
      </div>
    </nav>
  );
}


