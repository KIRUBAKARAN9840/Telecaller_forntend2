'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

export default function LoginForm({ onOTPSent }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [userType, setUserType] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = userType === 'manager'
        ? '/telecaller/manager/send-otp'
        : '/telecaller/telecaller/send-otp';

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Important for cookies!
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        onOTPSent(mobileNumber, userType);
      } else {
        setError(data.detail || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('manager')}
              className={`py-2 px-4 rounded-lg border transition-colors ${
                userType === 'manager'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setUserType('telecaller')}
              className={`py-2 px-4 rounded-lg border transition-colors ${
                userType === 'telecaller'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Telecaller
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-300 mb-2">
            Mobile Number
          </label>
          <input
            id="mobile"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            className="input-field w-full"
            maxLength={10}
            required
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
}

LoginForm.propTypes = {
  onOTPSent: PropTypes.func.isRequired,
};