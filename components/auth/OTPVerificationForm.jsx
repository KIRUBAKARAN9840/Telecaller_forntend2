'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import api from '@/lib/axios';

export default function OTPVerificationForm({ mobileNumber, userType, onBack, onLoginSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useState(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = userType === 'manager'
        ? '/telecaller/manager/verify-otp'
        : '/telecaller/telecaller/verify-otp';

      // Use axios instance which has withCredentials enabled and proper baseURL
      const response = await api.post(endpoint, {
        mobile_number: mobileNumber,
        otp: otpValue,
        device_type: 'web',
      });

      const data = response.data;

      console.log('OTP verification successful:', data);

      // For web clients, tokens are set as HTTP-only cookies by the backend
      // We only receive user data in the response
      console.log('Calling onLoginSuccess with user data:', data.user);
      onLoginSuccess(data.user);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = userType === 'manager'
        ? '/telecaller/manager/send-otp'
        : '/telecaller/telecaller/send-otp';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Important for cookies!
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtp(['', '', '', '', '', '']);
        setTimeLeft(60);
        setCanResend(false);
      } else {
        setError(data.detail || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card p-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
      <p className="text-gray-400 mb-2">
        Enter the 6-digit code sent to {mobileNumber.slice(0, 2)}******{mobileNumber.slice(-2)}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-12 text-center text-xl font-semibold bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              maxLength={1}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="text-center">
          {!canResend ? (
            <p className="text-gray-400">
              Resend OTP in <span className="text-white font-medium">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

OTPVerificationForm.propTypes = {
  mobileNumber: PropTypes.string.isRequired,
  userType: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
};
