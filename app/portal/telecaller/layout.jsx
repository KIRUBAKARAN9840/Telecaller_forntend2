'use client';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Header from '@/app/portal/components/Header';
import Sidebar from '@/app/portal/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function TelecallerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    console.log('TelecallerLayout: Checking authentication, userData:', userData);

    if (!userData) {
      console.log('TelecallerLayout: No user data, redirecting to login');
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('TelecallerLayout: Parsed user:', parsedUser);

      if (parsedUser.role !== 'telecaller') {
        console.log('TelecallerLayout: User is not a telecaller, redirecting to manager dashboard');
        router.push('/portal/manager/dashboard');
        return;
      }

      console.log('TelecallerLayout: Authentication successful, setting user');
      setUser(parsedUser);
    } catch (error) {
      console.error('TelecallerLayout: Error parsing user data:', error);
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
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Sidebar - Fixed on desktop, hidden on mobile */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
        <Sidebar
          isOpen={true}
          onClose={() => setSidebarOpen(false)}
          userRole="telecaller"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole="telecaller"
            isCollapsed={false}
            onToggleCollapse={() => {}}
          />
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-14' : 'lg:ml-60'}`}>
        {/* Header - Fixed at top */}
        <div className={`fixed top-0 right-0 z-30 bg-gray-900 transition-all duration-300 ${sidebarCollapsed ? 'left-14 lg:left-14' : 'left-0 lg:left-60'}`}>
          <Header
            user={user}
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        {/* Page Content - Scrollable area */}
        <main className="flex-1 bg-gray-900 overflow-y-auto pt-[4rem]">
          {children}
        </main>
      </div>
    </div>
  );
}

TelecallerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};