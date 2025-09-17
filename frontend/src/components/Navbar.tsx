import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-800">
          Monastery360
        </Link>
        <div className="flex gap-6">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
            Home
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
            Events
          </NavLink>
          <NavLink to="/archives" className={({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
            Archives
          </NavLink>
        </div>
      </div>
    </nav>
  );
}


