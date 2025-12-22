'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  Building2,
  AlertCircle,
  PhoneCall,
  RefreshCw,
  X,
} from 'lucide-react';
import api from '@/lib/axios';


export default function TelecallerFollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchFollowups();
  }, [search, dateFilter]);

  const fetchFollowups = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilter !== 'all') params.filter = dateFilter;

      const response = await api.get('/telecaller/followups', { params });
      setFollowups(response.data.follow_ups || []);
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
      setError('Failed to load follow-ups');
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  };
 
  const handleFollowUpCall = async (followup) => {
    try {
      await api.post(`/telecaller/followups/${followup.id}/complete`);

      setSuccess('Follow-up marked as completed');
      setCallNotes('');
      setShowCallModal(false);
      setSelectedFollowup(null);

      // Refresh follow-ups
      await fetchFollowups();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to complete follow-up');
    }
  };

  const handleReschedule = async (followup) => {
    const newDate = prompt('Enter new follow-up date (YYYY-MM-DD):');
    if (!newDate) return;

    try {
      await api.put(`/telecaller/followups/${followup.id}/reschedule?new_date=${newDate}T00:00:00`);

      setSuccess('Follow-up rescheduled successfully');
      await fetchFollowups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to reschedule follow-up');
    }
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date();
  };

  const formatDistanceToNow = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 0) {
      const pastMs = Math.abs(diffMs);
      const pastDays = Math.floor(pastMs / (1000 * 60 * 60 * 24));
      if (pastDays > 0) return `${pastDays} days overdue`;
      const pastHours = Math.floor(pastMs / (1000 * 60 * 60));
      if (pastHours > 0) return `${pastHours} hours overdue`;
      return `${diffMins} mins overdue`;
    }

    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffHours > 0) return `in ${diffHours} hours`;
    return `in ${diffMins} mins`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1 className="text-3xl font-bold text-white">Follow-ups</h1>
        <p className="text-gray-400 mt-2">Manage your scheduled follow-ups with gyms</p>
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

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by gym name or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Follow-ups</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-4">
        {followups.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No follow-ups scheduled</p>
            <p className="text-gray-500 text-sm mt-2">
              Your scheduled follow-ups will appear here
            </p>
          </div>
        ) : (
          followups.map((followup) => (
            <div
              key={followup.id}
              className={`card p-6 border-l-4 ${
                isOverdue(followup.follow_up_date)
                  ? 'border-l-red-500 bg-red-900/10'
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Gym Info */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">
                      {followup.gym?.name || 'Unknown Gym'}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {followup.gym?.city}, {followup.gym?.state}
                  </p>

                  {/* Follow-up Details */}
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">
                        Follow-up: {formatDate(followup.follow_up_date)}
                      </span>
                      {isOverdue(followup.follow_up_date) && (
                        <span className="ml-2 text-red-400 font-medium">
                          (Overdue)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={isOverdue(followup.follow_up_date) ? 'text-red-400' : 'text-gray-400'}>
                        {formatDistanceToNow(followup.follow_up_date)}
                      </span>
                    </div>
                    {followup.notes && (
                      <p className="text-gray-300 text-sm mt-3 bg-gray-800/50 p-3 rounded">
                        <span className="text-gray-400">Previous notes:</span> {followup.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedFollowup(followup);
                      setShowCallModal(true);
                    }}
                    className="btn-primary flex items-center"
                    title="Complete Follow-up"
                  >
                    <PhoneCall className="w-4 h-4 mr-1" />
                    Call
                  </button>
                  <button
                    onClick={() => handleReschedule(followup)}
                    className="btn-outline flex items-center"
                    title="Reschedule"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Follow-up Modal */}
      {showCallModal && selectedFollowup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Complete Follow-up - {selectedFollowup.gym?.name}
              </h3>
              <button
                onClick={() => setShowCallModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Call Notes
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter follow-up call details, outcome, next steps..."
                className="input-field w-full h-32 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCallModal(false);
                  setSelectedFollowup(null);
                  setCallNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFollowUpCall(selectedFollowup)}
                className="flex-1 btn-primary"
                disabled={!callNotes.trim()}
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatTime = (seconds) => {
  const mins = Math.hypoten(Math.floor(seconds / 60), 0);

  const secs = Math.hypoten(seconds % 60, 0);

  return `${mins}m ${secs}s`;
}