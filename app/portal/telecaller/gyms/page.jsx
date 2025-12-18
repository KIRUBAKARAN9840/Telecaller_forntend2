'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  PhoneCall,
  Building2,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerGymsPage() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchGyms();
  }, [search]);

  const fetchGyms = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;

      const response = await api.get('/telecaller/telecaller/assigned-gyms', { params });
      setGyms(response.data.assigned_gyms || []);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      setError('Failed to load assigned gyms');
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallAction = async (gym, action) => {
    try {
      const payload = {
        action,
        notes: callNotes,
      };

      // Add follow_up_date for follow_up and no_response actions
      if (action === 'follow_up' || action === 'no_response') {
        if (!followUpDate) {
          setError('Follow-up date is required for follow-up and no response actions');
          return;
        }
        payload.follow_up_date = followUpDate;
      }

      await api.post(`/telecaller/telecaller/gyms/${gym.id}/call`, payload);

      setSuccess(`${action} recorded successfully for ${gym.name}`);
      setCallNotes('');
      setFollowUpDate('');
      setShowCallModal(false);
      setSelectedGym(null);

      // Refresh gyms to update last call status
      await fetchGyms();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to record call action');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCallStatusBadge = (lastCallStatus) => {
    const statusConfig = {
      interested: { color: 'bg-green-900/30 text-green-400', icon: CheckCircle },
      not_interested: { color: 'bg-red-900/30 text-red-400', icon: XCircle },
      follow_up: { color: 'bg-blue-900/30 text-blue-400', icon: Clock },
      no_response: { color: 'bg-gray-900/30 text-gray-400', icon: AlertCircle },
      converted: { color: 'bg-purple-900/30 text-purple-400', icon: CheckCircle },
      rejected: { color: 'bg-orange-900/30 text-orange-400', icon: XCircle },
    };

    const config = statusConfig[lastCallStatus] || statusConfig.no_response;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {lastCallStatus ? lastCallStatus.replace('_', ' ') : 'No calls yet'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">My Gyms</h1>
        <p className="text-gray-400 mt-2">View and manage your assigned gyms</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-800 text-green-400 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search gyms by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Gyms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gyms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No gyms assigned</p>
            <p className="text-gray-500 text-sm mt-2">
              Contact your manager to get gyms assigned to you
            </p>
          </div>
        ) : (
          gyms.map((gym) => (
            <div key={gym.id} className="card p-6">
              {/* Gym Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">{gym.name}</h3>
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {gym.city}, {gym.state}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-300">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {gym.phone || 'No phone'}
                </div>
                {gym.email && (
                  <div className="text-gray-300 text-sm truncate">{gym.email}</div>
                )}
              </div>

              {/* Call Status */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-1">Last Call Status</div>
                {getCallStatusBadge(gym.last_call_status)}
              </div>

              {/* Call History */}
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Calls</span>
                  <span className="text-white">{gym.total_calls || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Last Call</span>
                  <span className="text-white">{formatDate(gym.last_call_date)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedGym(gym);
                    setShowCallModal(true);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center"
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Log Call
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Log Call - {selectedGym.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Call Notes
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter call details, outcome, follow-up notes..."
                className="input-field w-full h-32 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Notes are required for "Converted" and "Rejected" actions
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Follow-up Date (for Follow-up & No Response)
              </label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input-field w-full"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for "Follow-up" and "No Response" actions
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Call Outcome
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  onClick={() => handleCallAction(selectedGym, 'interested')}
                  className="btn-outline text-green-400 border-green-600 hover:bg-green-900/20"
                >
                  Interested
                </button>
                <button
                  onClick={() => handleCallAction(selectedGym, 'not_interested')}
                  className="btn-outline text-red-400 border-red-600 hover:bg-red-900/20"
                >
                  Not Interested
                </button>
                <button
                  onClick={() => handleCallAction(selectedGym, 'follow_up')}
                  className="btn-outline text-blue-400 border-blue-600 hover:bg-blue-900/20"
                >
                  Follow Up
                </button>
                <button
                  onClick={() => handleCallAction(selectedGym, 'no_response')}
                  className="btn-outline text-gray-400 border-gray-600 hover:bg-gray-700/20"
                >
                  No Response
                </button>
                <button
                  onClick={() => handleCallAction(selectedGym, 'converted')}
                  className="btn-outline text-purple-400 border-purple-600 hover:bg-purple-900/20"
                >
                  Converted
                </button>
                <button
                  onClick={() => handleCallAction(selectedGym, 'rejected')}
                  className="btn-outline text-orange-400 border-orange-600 hover:bg-orange-900/20"
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCallModal(false);
                  setSelectedGym(null);
                  setCallNotes('');
                  setFollowUpDate('');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}