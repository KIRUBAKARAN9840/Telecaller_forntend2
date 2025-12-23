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
  X,
  Info,
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
  const [selectedGym, setSelectedGym] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedGymAddress, setSelectedGymAddress] = useState(null);

  // Filter states for pending tab
  const [targetDateFilter, setTargetDateFilter] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  // Filter states for follow-up tab
  const [followUpFilter, setFollowUpFilter] = useState('');
  const [followUpStartDate, setFollowUpStartDate] = useState('');
  const [followUpEndDate, setFollowUpEndDate] = useState('');

  // Filter states for converted tab
  const [convertedFilter, setConvertedFilter] = useState('');
  const [convertedStartDate, setConvertedStartDate] = useState('');
  const [convertedEndDate, setConvertedEndDate] = useState('');
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationNotComplete, setVerificationNotComplete] = useState(false);

  // Filter states for rejected tab
  const [rejectedFilter, setRejectedFilter] = useState('');
  const [rejectedStartDate, setRejectedStartDate] = useState('');
  const [rejectedEndDate, setRejectedEndDate] = useState('');

  // Filter states for no response tab
  const [noResponseFilter, setNoResponseFilter] = useState('');
  const [noResponseStartDate, setNoResponseStartDate] = useState('');
  const [noResponseEndDate, setNoResponseEndDate] = useState('');

  useEffect(() => {
    fetchGyms();
  }, [activeTab, pagination.page, targetDateFilter, targetStartDate, targetEndDate, followUpFilter, followUpStartDate, followUpEndDate, convertedFilter, convertedStartDate, convertedEndDate, verificationComplete, verificationNotComplete, rejectedFilter, rejectedStartDate, rejectedEndDate, noResponseFilter, noResponseStartDate, noResponseEndDate]);

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

      // Add target date filter for pending tab
      if (activeTab === 'pending' && targetDateFilter) {
        params.target_date_filter = targetDateFilter;
        if (targetDateFilter === 'custom' && targetStartDate && targetEndDate) {
          params.target_start_date = targetStartDate;
          params.target_end_date = targetEndDate;
        }
      }

      // Add follow-up date filter for follow-up tab
      if (activeTab === 'follow_up' && followUpFilter) {
        params.follow_up_filter = followUpFilter;
        if (followUpFilter === 'custom' && followUpStartDate && followUpEndDate) {
          params.follow_up_start_date = followUpStartDate;
          params.follow_up_end_date = followUpEndDate;
        }
      }

      // Add converted date filter for converted tab
      if (activeTab === 'converted' && convertedFilter) {
        params.converted_filter = convertedFilter;
        if (convertedFilter === 'custom' && convertedStartDate && convertedEndDate) {
          params.converted_start_date = convertedStartDate;
          params.converted_end_date = convertedEndDate;
        }
      }

      // Add verification filters for converted tab
      if (activeTab === 'converted') {
        if (verificationComplete) {
          params.verification_complete = 'true';
        } else if (verificationNotComplete) {
          params.verification_complete = 'false';
        }
      }

      // Add rejected date filter for rejected tab
      if (activeTab === 'rejected' && rejectedFilter) {
        params.rejected_filter = rejectedFilter;
        if (rejectedFilter === 'custom' && rejectedStartDate && rejectedEndDate) {
          params.rejected_start_date = rejectedStartDate;
          params.rejected_end_date = rejectedEndDate;
        }
      }

      // Add no response date filter for no response tab
      if (activeTab === 'no_response' && noResponseFilter) {
        params.no_response_filter = noResponseFilter;
        if (noResponseFilter === 'custom' && noResponseStartDate && noResponseEndDate) {
          params.no_response_start_date = noResponseStartDate;
          params.no_response_end_date = noResponseEndDate;
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
        target_date: assignment.target_date,
        follow_up_date: assignment.follow_up_date,
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

  const formatDateOnly = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleVerificationToggle = (type) => {
    if (type === 'complete') {
      setVerificationComplete(!verificationComplete);
      setVerificationNotComplete(false);
    } else {
      setVerificationNotComplete(!verificationNotComplete);
      setVerificationComplete(false);
    }
  };

  const handleViewHistory = async (gym) => {
    setSelectedGym(gym);
    setLoadingHistory(true);
    setFollowUpHistory([]);
    setShowHistoryModal(true);

    try {
      const response = await api.get(`/telecaller/manager/gym/${gym.gym_id}/call-history`);
      setFollowUpHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setFollowUpHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewAddress = (gym) => {
    setSelectedGymAddress(gym);
    setShowAddressModal(true);
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

      {/* Filters for Pending Tab */}
      {activeTab === 'pending' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap items-end gap-3">
            
            {/* Target Date Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Target Date Filter
              </label>
              <select
                value={targetDateFilter}
                onChange={(e) => {
                  setTargetDateFilter(e.target.value);
                  setTargetStartDate('');
                  setTargetEndDate('');
                }}
                className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Target Date Range */}
            {targetDateFilter === 'custom' && (
              <>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Target Start
                  </label>
                  <input
                    type="date"
                    value={targetStartDate}
                    onChange={(e) => setTargetStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Target End
                  </label>
                  <input
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters for Follow-up Tab */}
      {activeTab === 'follow_up' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap items-end gap-3">
            {/* Follow-up Date Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Follow-up Date Filter
              </label>
              <select
                value={followUpFilter}
                onChange={(e) => {
                  setFollowUpFilter(e.target.value);
                  setFollowUpStartDate('');
                  setFollowUpEndDate('');
                }}
                className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="overdue">Overdue</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Follow-up Date Range */}
            {followUpFilter === 'custom' && (
              <>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Follow-up Start
                  </label>
                  <input
                    type="date"
                    value={followUpStartDate}
                    onChange={(e) => setFollowUpStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Follow-up End
                  </label>
                  <input
                    type="date"
                    value={followUpEndDate}
                    onChange={(e) => setFollowUpEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters for Converted Tab */}
      {activeTab === 'converted' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap items-end gap-3">
            {/* Converted Date Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Converted Date Filter
              </label>
              <select
                value={convertedFilter}
                onChange={(e) => {
                  setConvertedFilter(e.target.value);
                  setConvertedStartDate('');
                  setConvertedEndDate('');
                }}
                className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Converted Date Range */}
            {convertedFilter === 'custom' && (
              <>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Converted Start
                  </label>
                  <input
                    type="date"
                    value={convertedStartDate}
                    onChange={(e) => setConvertedStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Converted End
                  </label>
                  <input
                    type="date"
                    value={convertedEndDate}
                    onChange={(e) => setConvertedEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}

            {/* Verification Filters */}
            <div className="min-w-[320px]">
              {/* <label className="block text-xs font-medium text-gray-300 mb-1">Verification Filter</label> */}
              <div className="flex gap-4">
                {/* Verification Completed Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Verification Completed</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verificationComplete}
                      onChange={() => handleVerificationToggle('complete')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                {/* Not Verified Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Not Verified</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verificationNotComplete}
                      onChange={() => handleVerificationToggle('not_complete')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters for Rejected Tab */}
      {activeTab === 'rejected' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap items-end gap-3">
            {/* Rejected Date Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Rejected Date Filter
              </label>
              <select
                value={rejectedFilter}
                onChange={(e) => {
                  setRejectedFilter(e.target.value);
                  setRejectedStartDate('');
                  setRejectedEndDate('');
                }}
                className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Rejected Date Range */}
            {rejectedFilter === 'custom' && (
              <>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Rejected Start
                  </label>
                  <input
                    type="date"
                    value={rejectedStartDate}
                    onChange={(e) => setRejectedStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Rejected End
                  </label>
                  <input
                    type="date"
                    value={rejectedEndDate}
                    onChange={(e) => setRejectedEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters for No Response Tab */}
      {activeTab === 'no_response' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap items-end gap-3">
            {/* No Response Date Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                No Response Date Filter
              </label>
              <select
                value={noResponseFilter}
                onChange={(e) => {
                  setNoResponseFilter(e.target.value);
                  setNoResponseStartDate('');
                  setNoResponseEndDate('');
                }}
                className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom No Response Date Range */}
            {noResponseFilter === 'custom' && (
              <>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    No Response Start
                  </label>
                  <input
                    type="date"
                    value={noResponseStartDate}
                    onChange={(e) => setNoResponseStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="min-w-[130px]">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    No Response End
                  </label>
                  <input
                    type="date"
                    value={noResponseEndDate}
                    onChange={(e) => setNoResponseEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gym Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No gyms found for this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Gym Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Telecaller
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Target Date
                    </th>
                  )}
                  {activeTab === 'follow_up' && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Follow-up Date
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Assigned On
                  </th>
                  {activeTab !== 'pending' && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {gyms.map((gym) => (
                  <tr
                    key={gym.gym_id}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-white">
                          {gym.gym_name}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAddress(gym);
                          }}
                          className="text-gray-400 hover:text-blue-400 transition-colors flex items-center"
                          title="View Full Address"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {gym.contact_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {gym.telecaller_name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full whitespace-nowrap ${
                          gym.call_status === 'converted' ? 'bg-green-100 text-green-800' :
                          gym.call_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          gym.call_status === 'follow_up' ? 'bg-blue-100 text-blue-800' :
                          gym.call_status === 'no_response' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {TABS.find(tab => tab.id === gym.call_status)?.name || gym.call_status}
                      </span>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {gym.target_date ? formatDateOnly(gym.target_date) : 'N/A'}
                        </div>
                      </td>
                    )}
                    {activeTab === 'follow_up' && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {gym.follow_up_date ? formatDateOnly(gym.follow_up_date) : 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {gym.assigned_at ? formatDateOnly(gym.assigned_at) : 'N/A'}
                      </div>
                    </td>
                    {activeTab !== 'pending' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewHistory(gym)}
                          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                          title="View Call History"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card mt-4 p-4">
          <div className="flex items-center justify-between">
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
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Call History - {selectedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : followUpHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No call history found</p>
                </div>
              ) : (
                followUpHistory.map((log) => (
                  <div key={log.log_id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">
                          {log.call_status.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </p>
                        {log.telecaller_name && (
                          <p className="text-xs text-gray-400">
                            By: {log.telecaller_name}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.call_status === 'converted'
                          ? 'bg-green-900/30 text-green-400'
                          : log.call_status === 'follow_up'
                          ? 'bg-blue-900/30 text-blue-400'
                          : log.call_status === 'rejected'
                          ? 'bg-red-900/30 text-red-400'
                          : log.call_status === 'no_response'
                          ? 'bg-gray-900/30 text-gray-400'
                          : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {log.call_status.replace('_', ' ')}
                      </span>
                    </div>
                    {log.remarks && (
                      <p className="text-gray-300 text-sm mt-2">{log.remarks}</p>
                    )}
                    {log.follow_up_date && (
                      <p className="text-blue-400 text-xs mt-2">
                        Follow-up scheduled: {formatDate(log.follow_up_date)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && selectedGymAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedGymAddress.gym_name}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-400">Phone Number</p>
                <p className="text-white">
                  {selectedGymAddress.contact_number || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-400">Full Address</p>
                <p className="text-white">
                  {selectedGymAddress.address || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-400">Area</p>
                <p className="text-white">
                  {selectedGymAddress.area || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-400">City</p>
                <p className="text-white">
                  {selectedGymAddress.city || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}