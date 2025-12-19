'use client';

import { useEffect, useState } from 'react';
import { Building2, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';

const TABS = [
  { id: 'pending', name: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'yellow' },
  { id: 'follow_up', name: 'Follow-up', icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
  { id: 'converted', name: 'Converted', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
  { id: 'rejected', name: 'Rejected', icon: <XCircle className="w-5 h-5" />, color: 'red' }
];

export default function TelecallerDashboardNew() {
  const [activeTab, setActiveTab] = useState('pending');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);

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
      setError('Failed to fetch gyms');
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
      await api.post(`/telecaller/telecaller/update-gym-status`, {
        gym_id: selectedGym.gym_id,
        status: status,
        notes: notes,
        follow_up_date: followUpDate
      });

      setShowCallModal(false);
      setSelectedGym(null);
      fetchGyms(); // Refresh the list
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update gym status');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Telecaller Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage your gym calls and track their status</p>
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
                    <span className="text-gray-400">Contact:</span> {gym.contact_person}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Phone:</span> {gym.contact_number}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">City:</span> {gym.city}
                  </p>
                  {gym.last_call_date && (
                    <p className="text-gray-300">
                      <span className="text-gray-400">Last Call:</span> {new Date(gym.last_call_date).toLocaleDateString()}
                    </p>
                  )}
                  {gym.follow_up_date && gym.call_status === 'follow_up' && (
                    <p className="text-blue-400">
                      <span className="text-gray-400">Follow-up:</span> {new Date(gym.follow_up_date).toLocaleString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCallClick(gym)}
                  className="w-full mt-4 btn-primary"
                  disabled={gym.call_status === 'converted' || gym.call_status === 'rejected'}
                >
                  {gym.call_status === 'converted' || gym.call_status === 'rejected'
                    ? 'Status Closed'
                    : <><Phone className="inline w-4 h-4 mr-2" /> Log Call
                  </>}
                </button>
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

    if ((status === 'follow_up' && !followUpDate) || (status === 'converted' && !notes)) {
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
            </select>
          </div>

          {(status === 'follow_up' || status === 'converted') && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {status === 'follow_up' ? 'Follow-up Date *' : 'Notes *'}
              </label>
              {status === 'follow_up' ? (
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="input-field w-full"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field w-full"
                  rows="3"
                  placeholder="Enter conversion details..."
                  required
                />
              )}
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