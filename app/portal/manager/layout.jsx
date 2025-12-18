'use client';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Header from '@/app/portal/components/Header';
import Sidebar from '@/app/portal/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function ManagerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    console.log('ManagerLayout: Checking authentication, userData:', userData);

    if (!userData) {
      console.log('ManagerLayout: No user data, redirecting to login');
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('ManagerLayout: Parsed user:', parsedUser);

      if (parsedUser.role !== 'manager') {
        console.log('ManagerLayout: User is not a manager, redirecting to telecaller dashboard');
        router.push('/portal/telecaller/dashboard');
        return;
      }

      console.log('ManagerLayout: Authentication successful, setting user');
      setUser(parsedUser);
    } catch (error) {
      console.error('ManagerLayout: Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <Sidebar
          isOpen={true}
          onClose={() => setSidebarOpen(false)}
          userRole="manager"
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole="manager"
          />
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <Header
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1 bg-gray-900 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

ManagerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};