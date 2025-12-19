'use client';

import { useEffect, useState } from 'react';
import { Building2, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';

const TABS = [
  { id: 'pending', name: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'yellow' },
  { id: 'follow_up', name: 'Follow-up', icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
  { id: 'converted', name: 'Converted', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
  { id: 'rejected', name: 'Rejected', icon: <XCircle className="w-5 h-5" />, color: 'red' },
  { id: 'no_response', name: 'No Response', icon: <Phone className="w-5 h-5" />, color: 'gray' }
];

export default function Tracker() {
  const [activeTab, setActiveTab] = useState('pending');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchGyms();
  }, [activeTab]);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/telecaller/telecaller/gyms?status=${activeTab}`);
      setGyms(response.data.gyms || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch gyms: ' + (error.response?.data?.detail || error.message));
      }
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallClick = (gym) => {
    setSelectedGym(gym);
    setShowCallModal(true);
  };

  const handleStatusUpdate = async (status, notes, followUpDate) => {
    try {
      console.log('Updating gym status:', {
        gym_id: selectedGym.gym_id,
        status: status,
        notes: notes,
        follow_up_date: followUpDate
      });

      const response = await api.post(`/telecaller/telecaller/update-gym-status`, {
        gym_id: selectedGym.gym_id,
        status: status,
        notes: notes,
        follow_up_date: followUpDate
      });

      console.log('Status update response:', response.data);
      alert('Status updated successfully!');

      setShowCallModal(false);
      setSelectedGym(null);
      fetchGyms(); // Refresh the list
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + (error.response?.data?.detail || error.message));
      setError('Failed to update gym status');
    }
  };

  const handleViewHistory = async (gym) => {
    setLoadingHistory(true);
    setSelectedGym(gym);
    try {
      const response = await api.get(`/telecaller/telecaller/gym/${gym.gym_id}/follow-up-history`);
      setFollowUpHistory(response.data.history || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch follow-up history:', error);
      alert('Failed to fetch follow-up history: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gym Tracker</h1>
        <p className="text-gray-400 mt-2">Track and manage your gym calls and their status</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors
              ${activeTab === tab.id
                ? 'bg-gray-800 text-white border-t-2 border-red-500'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No gyms found in {activeTab}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gyms.map((gym) => (
              <div key={gym.gym_id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold text-lg">{gym.gym_name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300`}>
                    {TABS.find(t => t.id === gym.call_status)?.name || gym.call_status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Phone:</span> {gym.contact_number}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">City:</span> {gym.city}
                  </p>
                  {gym.last_call_date && (
                    <p className="text-gray-300">
                      <span className="text-gray-400">Last Call:</span> {new Date(gym.last_call_date).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata'
                      })}
                    </p>
                  )}
                  {gym.follow_up_date && gym.call_status === 'follow_up' && (
                    <p className="text-blue-400">
                      <span className="text-gray-400">Follow-up:</span> {new Date(gym.follow_up_date).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata'
                      })}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleCallClick(gym)}
                    className="flex-1 btn-primary"
                    disabled={gym.call_status === 'converted' || gym.call_status === 'rejected'}
                  >
                    {gym.call_status === 'converted' || gym.call_status === 'rejected'
                      ? 'Status Closed'
                      : <><Phone className="inline w-4 h-4 mr-2" /> Log Call
                    </>}
                  </button>
                  <button
                    onClick={() => handleViewHistory(gym)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                    title="View Follow-up History"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && selectedGym && (
        <CallModal
          gym={selectedGym}
          onClose={() => {
            setShowCallModal(false);
            setSelectedGym(null);
          }}
          onSave={handleStatusUpdate}
        />
      )}

      {/* Follow-up History Modal */}
      {showHistoryModal && selectedGym && (
        <FollowUpHistoryModal
          gym={selectedGym}
          history={followUpHistory}
          loading={loadingHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedGym(null);
            setFollowUpHistory([]);
          }}
        />
      )}
    </div>
  );
}

// Call Modal Component
function CallModal({ gym, onClose, onSave }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!status) {
      alert('Please select a status');
      return;
    }

    if ((status === 'follow_up' && (!followUpDate || !notes)) || (status === 'converted' && !notes)) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    await onSave(status, notes, followUpDate || null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Log Call - {gym.gym_name}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Call Outcome *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">Select outcome...</option>
              <option value="follow_up">Follow-up</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
              <option value="no_response">No Response</option>
            </select>
          </div>

          {(status === 'follow_up' || status === 'converted' || status === 'rejected') && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {status === 'follow_up' ? 'Notes *' :
                 status === 'converted' ? 'Notes *' :
                 'Reason'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field w-full"
                rows="3"
                placeholder={
                  status === 'follow_up' ? 'Enter follow-up details...' :
                  status === 'converted' ? 'Enter conversion details...' :
                  'Enter reason for rejection...'
                }
                required={status === 'follow_up' || status === 'converted'}
              />
            </div>
          )}

          {status === 'follow_up' && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Follow-up Date *
              </label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input-field w-full"
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          )}

          {status === 'rejected' && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Reason (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field w-full"
                rows="2"
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Follow-up History Modal Component
function FollowUpHistoryModal({ gym, history, loading, onClose }) {
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'follow_up':
        return 'bg-blue-900/50 text-blue-400 border border-blue-800';
      case 'converted':
        return 'bg-green-900/50 text-green-400 border border-green-800';
      case 'rejected':
        return 'bg-red-900/50 text-red-400 border border-red-800';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400 border border-yellow-800';
      case 'no_response':
        return 'bg-gray-900/50 text-gray-400 border border-gray-800';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'follow_up':
        return 'Follow-up';
      case 'converted':
        return 'Converted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'no_response':
        return 'No Response';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Follow-up History - {gym.gym_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No follow-up history found</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            {history.map((log, index) => (
              <div key={log.log_id} className="bg-gray-700 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(log.call_status)}`}>
                      {getStatusText(log.call_status)}
                    </span>
                    {log.follow_up_date && (
                      <span className="text-blue-400 text-sm">
                        Follow-up: {new Date(log.follow_up_date).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Kolkata'
                        })}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Kolkata'
                    })}
                  </span>
                </div>
                {log.remarks && (
                  <p className="text-gray-300 text-sm mt-2">
                    <span className="text-gray-400 font-medium">Notes: </span>
                    {log.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}