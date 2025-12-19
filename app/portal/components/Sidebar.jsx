'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PropTypes from 'prop-types';
import {
  Home,
  Users,
  Building2,
  BarChart3,
  Phone,
  X,
  Target,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, userRole }) {
  const pathname = usePathname();

  const managerMenuItems = [
    { name: 'Dashboard', href: '/portal/manager/dashboard', icon: Home },
    { name: 'Telecallers', href: '/portal/manager/telecallers', icon: Users },
    { name: 'Gym Assignment', href: '/portal/manager/assignments', icon: Building2 },
    { name: 'Performance', href: '/portal/manager/performance', icon: BarChart3 },
  ];

  const telecallerMenuItems = [
    { name: 'Dashboard', href: '/portal/telecaller/dashboard', icon: Home },
    { name: 'Tracker', href: '/portal/telecaller/tracker', icon: Target },
    { name: 'Call History', href: '/portal/telecaller/calls', icon: Phone },
  ];

  const menuItems = userRole === 'manager' ? managerMenuItems : telecallerMenuItems;

  return (
    <div className={`
        w-64 h-full bg-gray-800 border-r border-gray-700 flex-shrink-0 flex flex-col
        lg:relative fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">FittBot</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive
                      ? 'bg-gray-700 text-white border-r-4 border-red-500'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <item.icon
                    className={`
                      mr-3 h-6 w-6 flex-shrink-0
                      ${isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-300'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <p>© 2024 FittBot</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userRole: PropTypes.oneOf(['manager', 'telecaller']).isRequired,
};