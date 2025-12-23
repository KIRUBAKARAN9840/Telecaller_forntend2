'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import OTPVerificationForm from '@/components/auth/OTPVerificationForm';

export default function Home() {
  const router = useRouter();
  const [showOTP, setShowOTP] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [userType, setUserType] = useState('manager');

  const handleOTPSent = (mobile, type) => {
    setMobileNumber(mobile);
    setUserType(type);
    setShowOTP(true);
  };

  const handleBack = () => {
    setShowOTP(false);
    setMobileNumber('');
  };

  const handleLoginSuccess = (userData) => {
    console.log('handleLoginSuccess called with:', userData);
    // Store user data in localStorage for dashboard use
    const userWithDefaults = {
      id: userData.id || 1,
      name: userData.name || 'Admin User',
      mobile_number: userData.mobile_number,
      role: userData.role
    };
    console.log('Storing user data:', userWithDefaults);
    localStorage.setItem('user', JSON.stringify(userWithDefaults));

    // Redirect based on user type
    const route = userData.role === 'manager' ? '/portal/manager/dashboard' : '/portal/telecaller/dashboard';
    console.log('Redirecting to:', route);
    router.push(route);
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2"><span className="text-[#ff5757]">Fitt</span>Bot Telecaller</h1>
          <p className="text-gray-400">Management Dashboard</p>
        </div>

        {!showOTP ? (
          <LoginForm onOTPSent={handleOTPSent} />
        ) : (
          <OTPVerificationForm
            mobileNumber={mobileNumber}
            userType={userType}
            onBack={handleBack}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </main>
  );
}