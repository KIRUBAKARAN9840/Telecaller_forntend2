'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Filter,
  X,
  Info,
} from 'lucide-react';
import api from '@/lib/axios';

const TABS = [
  { id: 'pending', name: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'yellow' },
  { id: 'follow_up', name: 'Follow-up', icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
  { id: 'converted', name: 'Converted', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
  { id: 'rejected', name: 'Rejected', icon: <XCircle className="w-5 h-5" />, color: 'red' },
  { id: 'no_response', name: 'No Response', icon: <Phone className="w-5 h-5" />, color: 'gray' }
];

const formatDate = (dateString) => {
  if (!dateString) return null;
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

export default function TelecallerPerformancePage() {
  const router = useRouter();
  const [telecaller, setTelecaller] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedGymAddress, setSelectedGymAddress] = useState(null);

  // Filter states for different tabs
  const [pendingFilter, setPendingFilter] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');

  const [followUpFilter, setFollowUpFilter] = useState('');
  const [followUpStartDate, setFollowUpStartDate] = useState('');
  const [followUpEndDate, setFollowUpEndDate] = useState('');

  const [convertedFilter, setConvertedFilter] = useState('');
  const [convertedStartDate, setConvertedStartDate] = useState('');
  const [convertedEndDate, setConvertedEndDate] = useState('');

  const [rejectedFilter, setRejectedFilter] = useState('');
  const [rejectedStartDate, setRejectedStartDate] = useState('');
  const [rejectedEndDate, setRejectedEndDate] = useState('');

  const [noResponseFilter, setNoResponseFilter] = useState('');
  const [noResponseStartDate, setNoResponseStartDate] = useState('');
  const [noResponseEndDate, setNoResponseEndDate] = useState('');

  useEffect(() => {
    // Get telecaller info from URL params
    const params = new URLSearchParams(window.location.search);
    const telecallerId = params.get('telecallerId');
    const telecallerName = params.get('telecallerName');

    if (!telecallerId) {
      router.push('/portal/manager/telecallers');
      return;
    }

    setTelecaller({
      id: telecallerId,
      name: decodeURIComponent(telecallerName || 'Unknown')
    });
  }, [router]);

  useEffect(() => {
    // Only fetch gyms when telecaller data is available
    if (telecaller?.id) {
      fetchGyms();
    }
  }, [activeTab, pendingFilter, pendingStartDate, pendingEndDate, followUpFilter, followUpStartDate, followUpEndDate, convertedFilter, convertedStartDate, convertedEndDate, rejectedFilter, rejectedStartDate, rejectedEndDate, noResponseFilter, noResponseStartDate, noResponseEndDate, telecaller?.id]);

  const fetchGyms = async () => {
    // Only proceed if telecaller data is available
    if (!telecaller?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters for the manager endpoint with filtering
      const params = new URLSearchParams({
        telecaller_id: telecaller.id,
        call_status: activeTab
      });

      // Add target date filter for pending tab
      if (activeTab === 'pending' && pendingFilter) {
        params.append('target_date_filter', pendingFilter);
        if (pendingFilter === 'custom' && pendingStartDate && pendingEndDate) {
          params.append('target_start_date', pendingStartDate);
          params.append('target_end_date', pendingEndDate);
        }
      }

      // Add follow-up date filter for follow-up tab
      if (activeTab === 'follow_up' && followUpFilter) {
        params.append('follow_up_filter', followUpFilter);
        if (followUpFilter === 'custom' && followUpStartDate && followUpEndDate) {
          params.append('follow_up_start_date', followUpStartDate);
          params.append('follow_up_end_date', followUpEndDate);
        }
      }

      // Add converted date filter for converted tab
      if (activeTab === 'converted' && convertedFilter) {
        params.append('converted_filter', convertedFilter);
        if (convertedFilter === 'custom' && convertedStartDate && convertedEndDate) {
          params.append('converted_start_date', convertedStartDate);
          params.append('converted_end_date', convertedEndDate);
        }
      }

      console.log('Fetching gyms for telecaller:', telecaller?.id, 'with params:', params.toString());

      // Use the manager endpoint that supports filtering
      const response = await api.get(`/telecaller/manager/assignments/all?${params.toString()}`);

      console.log('API response:', response.data);

      // The manager endpoint returns 'assignments' not 'gyms'
      const assignments = response.data.assignments || [];

      // Convert assignments to gym format for the UI
      const gymsData = assignments.map(assignment => ({
        gym_id: assignment.gym_id,
        gym_name: assignment.gym_name,
        contact_person: assignment.contact_person,
        contact_number: assignment.contact_number,
        address: assignment.address,
        area: assignment.area,
        city: assignment.city,
        call_status: assignment.current_call_status,
        target_date: assignment.gym_target_date,
        last_call_date: assignment.last_call_date,
        follow_up_date: assignment.follow_up_date,
        document_collected: assignment.document_collected,
        membership_collected: assignment.membership_collected,
        session_collected: assignment.session_collected,
        daily_pass_collected: assignment.daily_pass_collected,
        studio_images_collected: assignment.studio_images_collected,
        agreement_collected: assignment.agreement_collected,
        telecaller_name: assignment.telecaller_name,
        assigned_at: assignment.assigned_at
      }));

      // Debug: Log the call_status values to see what we're getting
      console.log('Call statuses in gymsData:', gymsData.map(g => ({ gym_name: g.gym_name, call_status: g.call_status })));

      setGyms(gymsData);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to load gym data: ${error.response?.data?.detail || error.message}`);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/portal/manager/telecallers');
  };

  const clearFilters = () => {
    setPendingFilter('');
    setPendingStartDate('');
    setPendingEndDate('');
    setFollowUpFilter('');
    setFollowUpStartDate('');
    setFollowUpEndDate('');
    setConvertedFilter('');
    setConvertedStartDate('');
    setConvertedEndDate('');
    setRejectedFilter('');
    setRejectedStartDate('');
    setRejectedEndDate('');
    setNoResponseFilter('');
    setNoResponseStartDate('');
    setNoResponseEndDate('');
  };

  const handleViewHistory = async (gym) => {
    setSelectedGym(gym);
    setLoadingHistory(true);
    setFollowUpHistory([]);
    setShowHistoryModal(true);

    try {
      // Use the manager endpoint for gym call history
      const response = await api.get(`/telecaller/manager/gym/${gym.gym_id}/call-history`);
      setFollowUpHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch follow-up history:', error);
      setError('Failed to fetch follow-up history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewAddress = (gym) => {
    setSelectedGymAddress(gym);
    setShowAddressModal(true);
  };

  
  const getFilterDisplay = () => {
    switch (activeTab) {
      case 'pending':
        return pendingFilter || 'All';
      case 'follow_up':
        return followUpFilter || 'All';
      case 'converted':
        return convertedFilter || 'All';
      case 'rejected':
        return rejectedFilter || 'All';
      case 'no_response':
        return noResponseFilter || 'All';
      default:
        return 'All';
    }
  };

  if (!telecaller) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">
                    {telecaller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {telecaller.name} - Performance Details
                  </h1>
                  <p className="text-gray-400 text-sm">
                    View detailed performance metrics and call history
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filter Options</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeTab === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Date
                    </label>
                    <select
                      value={pendingFilter}
                      onChange={(e) => setPendingFilter(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="overdue">Overdue</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {pendingFilter === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={pendingStartDate}
                          onChange={(e) => setPendingStartDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={pendingEndDate}
                          onChange={(e) => setPendingEndDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'follow_up' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Follow-up Date
                    </label>
                    <select
                      value={followUpFilter}
                      onChange={(e) => setFollowUpFilter(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="overdue">Overdue</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {followUpFilter === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={followUpStartDate}
                          onChange={(e) => setFollowUpStartDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={followUpEndDate}
                          onChange={(e) => setFollowUpEndDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'converted' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Converted Date
                    </label>
                    <select
                      value={convertedFilter}
                      onChange={(e) => setConvertedFilter(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {convertedFilter === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={convertedStartDate}
                          onChange={(e) => setConvertedStartDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={convertedEndDate}
                          onChange={(e) => setConvertedEndDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'rejected' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rejected Date
                    </label>
                    <select
                      value={rejectedFilter}
                      onChange={(e) => setRejectedFilter(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {rejectedFilter === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={rejectedStartDate}
                          onChange={(e) => setRejectedStartDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={rejectedEndDate}
                          onChange={(e) => setRejectedEndDate(e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? `border-${tab.color}-500 text-white`
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                  }
                `}
              >
                <div className="flex items-center">
                  {tab.icon}
                  <span className="ml-2">{tab.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === 'pending' && 'Pending Gyms'}
              {activeTab === 'follow_up' && 'Follow-up Gyms'}
              {activeTab === 'converted' && 'Converted Gyms'}
              {activeTab === 'rejected' && 'Rejected Gyms'}
              {activeTab === 'no_response' && 'No Response Gyms'}
            </h2>
            <span className="text-sm text-gray-400">
              Filter: {getFilterDisplay()}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {gyms.length} gyms found
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
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
                          {gym.target_date ? new Date(gym.target_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                    )}
                    {activeTab === 'follow_up' && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {gym.follow_up_date ? new Date(gym.follow_up_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {gym.telecaller_name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {gym.assigned_at ? new Date(gym.assigned_at).toLocaleDateString() : ''}
                      </div>
                    </td>
                    {activeTab !== 'pending' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewHistory(gym)}
                          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                          title="View Follow-up History"
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

      {/* Follow-up History Modal */}
      {showHistoryModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Follow-up History - {selectedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : followUpHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No follow-up history found</p>
            ) : (
              <div className="space-y-3">
                {followUpHistory.map((log, index) => (
                  <div
                    key={log.log_id || index}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">
                          {log.call_status ? log.call_status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </p>
                        {log.call_status === 'follow_up' && log.follow_up_date && (
                          <p className="text-xs text-blue-400 font-medium mt-1">
                            Follow-up: {formatDate(log.follow_up_date)}
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
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {log.call_status ? log.call_status.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                    {log.remarks && (
                      <p className="text-gray-300 text-sm">{log.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
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