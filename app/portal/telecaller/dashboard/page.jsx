'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/portal/components/common/StatCard';
import {
  Building2,
  Phone,
  Clock,
  TrendingUp,
  Calendar,
  XCircle,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerDashboard() {
  const [stats, setStats] = useState(null);
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const response = await api.get('/telecaller/telecaller/dashboard/stats');
      setStats(response.data);
      setError(null);

      // Fetch today's follow-ups
      try {
        const followupsResponse = await api.get('/telecaller/telecaller/follow-ups/today');
        console.log('Follow-ups response:', followupsResponse.data);
        // Ensure response is an array - backend returns { today_follow_ups: [...] }
        const followupsArray = followupsResponse.data?.today_follow_ups || [];
        console.log('Follow-ups array:', followupsArray);

        // Log individual follow-up data to debug
        followupsArray.forEach((followup, index) => {
          console.log(`Follow-up ${index}:`, {
            gym_name: followup.gym_name,
            owner_name: followup.owner_name,
            contact_number: followup.contact_number
          });
        });

        setTodayFollowups(Array.isArray(followupsArray) ? followupsArray : []);
      } catch (followupError) {
        console.error('Failed to fetch follow-ups:', followupError);
        console.error('Follow-up error response:', followupError.response);
        // Set empty array if follow-ups endpoint fails
        setTodayFollowups([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');

      // Fallback to mock data if API fails
      const mockStats = {
        assigned_gyms: 28,
        calls_today: 15,
        followups_today: 5,
        conversion_rate: 20.5,
      };

      const mockFollowups = [
        {
          id: 1,
          gym_name: 'FitZone Gym',
          owner_name: 'John Doe',
          contact_number: '9876543210',
          follow_up_date: new Date().toISOString(),
          remarks: 'Interested in premium membership',
        },
        {
          id: 2,
          gym_name: 'PowerFit Center',
          owner_name: 'Jane Smith',
          contact_number: '9876543211',
          follow_up_date: new Date().toISOString(),
          remarks: 'Follow up on pricing discussion',
        },
        {
          id: 3,
          gym_name: 'HealthHub',
          owner_name: 'Mike Johnson',
          contact_number: '9876543212',
          follow_up_date: new Date().toISOString(),
          remarks: 'Schedule demo session',
        },
      ];

      setStats(mockStats);
      setTodayFollowups(mockFollowups);
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
      fetchDashboardData(); // Refresh the dashboard data
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

  const statsData = [
    {
      title: 'Assigned Gyms',
      value: stats?.assigned_gyms || 0,
      icon: <Building2 className="w-8 h-8" />,
      color: 'blue',
      subtitle: 'Total in your list',
    },
    {
      title: 'Calls Today',
      value: stats?.calls_today || 0,
      icon: <Phone className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Follow-ups Today',
      value: stats?.followups_today || 0,
      icon: <Clock className="w-8 h-8" />,
      color: 'yellow',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversion_rate || 0}%`,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'green',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border border-red-800 bg-red-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-400">Error Loading Dashboard</h3>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Telecaller Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's your performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* Today's Follow-ups */}
      <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Follow-ups</h3>
          </div>

          {todayFollowups && Array.isArray(todayFollowups) && todayFollowups.length > 0 ? (
            <div className="space-y-4">
              {todayFollowups.map((followup) => (
                <div
                  key={followup.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{followup.gym_name}</h4>
                        <p className="text-gray-300 text-sm mt-1">
                          <span className="text-gray-400">Phone:</span> {followup.contact_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {followup.remarks && (
                      <p className="text-gray-400 text-xs italic mb-3">{followup.remarks}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCallClick(followup)}
                      className="btn-primary btn-sm text-xs px-5 py-1.5"
                    >
                      <Phone className="inline w-3 h-3 mr-1" />
                      Log
                    </button>
                    <button
                      onClick={() => handleViewHistory(followup)}
                      className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                      title="View Follow-up History"
                    >
                      <Clock className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No follow-ups scheduled for today</p>
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