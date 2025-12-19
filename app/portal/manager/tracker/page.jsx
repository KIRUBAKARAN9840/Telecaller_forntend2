'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import api from '@/lib/axios';

const TABS = [
  { id: 'pending', name: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'gray' },
  { id: 'follow_up', name: 'Follow-up', icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
  { id: 'converted', name: 'Converted', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
  { id: 'rejected', name: 'Rejected', icon: <XCircle className="w-5 h-5" />, color: 'red' },
  { id: 'no_response', name: 'No Response', icon: <Phone className="w-5 h-5" />, color: 'gray' }
];

export default function ManagerTracker() {
  const [activeTab, setActiveTab] = useState('pending');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchGyms();
  }, [activeTab, pagination.page]);

  const fetchGyms = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // If not "all", add status filter
      if (activeTab !== 'all') {
        // Map frontend status to database statuses
        if (activeTab === 'pending') {
          params.call_status = 'pending';
        } else if (activeTab === 'converted') {
          params.call_status = 'converted';
        } else if (activeTab === 'rejected') {
          params.call_status = 'rejected';
        } else if (activeTab === 'no_response') {
          params.call_status = 'no_response';
        } else if (activeTab === 'follow_up') {
          params.call_status = 'follow_up';
        }
      }

      const response = await api.get('/telecaller/manager/assignments/all', { params });

      // Filter to only show gyms under this manager
      const managerAssignments = response.data.assignments || [];
      const gymsWithStatus = managerAssignments.map(assignment => ({
        gym_id: assignment.gym_id,
        gym_name: assignment.gym_name,
        telecaller_name: assignment.telecaller_name,
        telecaller_mobile: assignment.telecaller_mobile,
        city: assignment.city,
        call_status: assignment.current_call_status || 'pending',
        assigned_at: assignment.assigned_at,
        contact_number: assignment.contact_number || 'Not available',
        address: assignment.address || '',
        area: assignment.area || '',
        telecaller_id: assignment.telecaller_id
      }));

      setGyms(gymsWithStatus);
      setPagination({
        page: pagination.page,
        limit: pagination.limit,
        total: response.data.total || 0,
        totalPages: response.data.total_pages || 1,
      });
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-900/30 text-gray-400', icon: Clock },
      follow_up: { color: 'bg-blue-900/30 text-blue-400', icon: AlertCircle },
      converted: { color: 'bg-green-900/30 text-green-400', icon: CheckCircle },
      rejected: { color: 'bg-red-900/30 text-red-400', icon: XCircle },
      no_response: { color: 'bg-gray-900/30 text-gray-400', icon: Phone },
      follow_up_required: { color: 'bg-blue-900/30 text-blue-400', icon: AlertCircle },
      'Not Contacted': { color: 'bg-yellow-900/30 text-yellow-400', icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

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
            <h3 className="text-lg font-medium text-red-400">Error Loading Data</h3>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchGyms}
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
        <h1 className="text-3xl font-bold text-white">Gym Tracker</h1>
        <p className="text-gray-400 mt-2">View all gym statuses under your management</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination(prev => ({ ...prev, page: 1 })); // Reset page when changing tabs
            }}
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

      {/* Gym Cards */}
      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No gyms found in {activeTab}</p>
          </div>
        ) : (
          <>
            {/* Gym Count */}
            <div className="mb-6">
              <p className="text-gray-400">
                Showing {gyms.length} gym{gyms.length !== 1 ? 's' : ''} in {activeTab}
              </p>
            </div>

            {/* Gym Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gyms.map((gym) => (
                <div
                  key={gym.gym_id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{gym.gym_name}</h3>
                      <p className="text-gray-300 text-sm mt-1">
                        <span className="text-gray-400">City:</span> {gym.city || 'Unknown'}
                      </p>
                      {gym.area && (
                        <p className="text-gray-300 text-sm">
                          <span className="text-gray-400">Area:</span> {gym.area}
                        </p>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(gym.call_status)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-400">Telecaller:</span> {gym.telecaller_name || 'Unassigned'}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Phone:</span> {gym.contact_number}
                    </p>
                    {gym.address && (
                      <p className="text-gray-300">
                        <span className="text-gray-400">Address:</span> {gym.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400">
                      Assigned: {gym.assigned_at ? formatDate(gym.assigned_at) : 'Not assigned'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                        title="View Call History"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} gyms
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}