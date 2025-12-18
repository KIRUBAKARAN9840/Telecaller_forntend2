'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Building2,
  MapPin,
  Phone,
  User,
  Calendar,
  X,
  UserMinus,
  Plus,
} from 'lucide-react';
import api from '@/lib/axios';

export default function AssignGymPage() {
  const searchParams = useSearchParams();
  const telecallerId = searchParams.get('telecallerId');
  const telecallerName = searchParams.get('telecallerName');

  console.log('📍 Page loaded with:', {
    telecallerId,
    telecallerName,
    urlParams: Object.fromEntries(searchParams.entries())
  });

  const [gyms, setGyms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // Limit to 50 gyms per page
    total: 0,
    totalPages: 0,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);

  useEffect(() => {
    if (!telecallerId) {
      setError('No telecaller selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchGyms();
    fetchAssignments();
  }, [telecallerId]);

  const fetchGyms = async () => {
    console.log('🔍 fetchGyms called');
    console.log('Current params:', {
      page: pagination.page,
      limit: pagination.limit,
      search: search
    });

    try {
      console.log('📡 Making API request to /telecaller/manager/gyms/all');
      const response = await api.get('/telecaller/manager/gyms/all', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search
        }
      });

      console.log('✅ API Response:', response.status);
      console.log('📊 Response data:', response.data);

      setGyms(response.data.gyms || []);
      // Update pagination totals only if not already set
      if (pagination.total === 0) {
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.total_pages || 1,
        }));
      }
    } catch (error) {
      console.error('❌ Failed to fetch gyms - Full error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data detail:', error.response?.data?.detail);
      console.error('❌ Error data full:', JSON.stringify(error.response?.data, null, 2));

      // Check if cookies are available
      console.log('🍪 Cookies:', document.cookie);

      setError(`Failed to fetch gyms: ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Separate effect for search - debounce it
  useEffect(() => {
    if (!telecallerId) return;

    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
      fetchGyms(); // Fetch gyms with new search term
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [search, telecallerId]);

  // Effect to fetch gyms when page changes
  useEffect(() => {
    if (telecallerId && pagination.page > 0 && search === '') {
      fetchGyms(); // Only fetch on page change if not searching
    }
  }, [pagination.page]);

  const fetchAssignments = async () => {
    console.log('🔍 fetchAssignments called');
    try {
      console.log('📡 Making API request to /telecaller/manager/assignments/all');
      const response = await api.get('/telecaller/manager/assignments/all', {
        params: {
          page: 1,
          limit: 1000  // Get more assignments at once since we need to check assignment status
        }
      });
      console.log('✅ Assignments API Response:', response.status);
      console.log('📊 Assignments count:', response.data.assignments?.length || 0);
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('❌ Failed to fetch assignments - Full error:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
    }
  };

  const isGymAssigned = (gymId) => {
    return assignments.some(assignment => assignment.gym_id === gymId);
  };

  const getAssignmentDetails = (gymId) => {
    return assignments.find(assignment => assignment.gym_id === gymId);
  };

  const handleGymClick = (gym) => {
    setSelectedGym({
      ...gym,
      isAssigned: isGymAssigned(gym.id),
      assignment: getAssignmentDetails(gym.id)
    });
    setShowModal(true);
  };

  const handleAssignGym = async () => {
    if (!selectedGym) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/telecaller/manager/assign-gym', {
        gym_id: selectedGym.id,
        telecaller_id: telecallerId
      });

      setSuccess(`Successfully assigned ${selectedGym.gym_name} to ${telecallerName}`);

      // Refresh data
      await fetchAssignments();
      await fetchGyms();

      setShowModal(false);
      setSelectedGym(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to assign gym');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignGym = async () => {
    if (!selectedGym || !selectedGym.isAssigned) return;

    if (!confirm('Are you sure you want to unassign this gym?')) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/telecaller/manager/unassign-gym', {
        gym_id: selectedGym.id
      });

      setSuccess(`Successfully unassigned ${selectedGym.gym_name}`);

      // Refresh data
      await fetchAssignments();
      await fetchGyms();

      setShowModal(false);
      setSelectedGym(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to unassign gym');
    } finally {
      setActionLoading(false);
    }
  };

  // Sort gyms: unassigned first, then assigned
  const sortedGyms = gyms.sort((a, b) => {
    const aAssigned = isGymAssigned(a.id);
    const bAssigned = isGymAssigned(b.id);

    if (aAssigned && !bAssigned) return 1;
    if (!aAssigned && bAssigned) return -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Back to Telecallers
        </button>
        <h1 className="text-3xl font-bold text-white">
          Assign Gyms to {decodeURIComponent(telecallerName || 'Telecaller')}
        </h1>
        <p className="text-gray-400 mt-2">Click on any gym to view details and assign/unassign</p>
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

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search gyms by name, city, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Gyms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGyms.map((gym) => {
          const isAssigned = isGymAssigned(gym.id);
          const assignment = getAssignmentDetails(gym.id);

          return (
            <div
              key={gym.id}
              onClick={() => handleGymClick(gym)}
              className={`card p-6 cursor-pointer transition-all hover:scale-105 ${
                isAssigned
                  ? 'opacity-60 bg-gray-800/50'
                  : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-red-400" />
                </div>
                {isAssigned && (
                  <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
                    Assigned
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{gym.gym_name}</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{gym.city || 'No location'}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{gym.contact_number || 'No phone'}</span>
                </div>

                {isAssigned && assignment && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <User className="w-3 h-3" />
                      <span>Assigned to: {assignment.telecaller_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>On: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedGyms.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No gyms found</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && search === '' && (
        <div className="flex items-center justify-between mt-6 mb-8">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} gyms
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {!loading && search !== '' && (
        <div className="flex items-center justify-between mt-6 mb-8">
          <div className="text-sm text-gray-400">
            Found {gyms.length} gyms matching "{search}"
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Gym Details</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedGym(null);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-white font-medium text-lg">{selectedGym.gym_name}</h4>
                <p className="text-gray-400">{selectedGym.city}</p>
              </div>

              <div className="text-sm text-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  <span>{selectedGym.contact_number}</span>
                </div>
              </div>

              {selectedGym.isAssigned && selectedGym.assignment && (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <h5 className="text-yellow-400 font-medium mb-2">Currently Assigned</h5>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>To: {selectedGym.assignment.telecaller_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>By: Manager ID {selectedGym.assignment.manager_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date: {new Date(selectedGym.assignment.assigned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedGym(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Close
              </button>

              {!selectedGym.isAssigned ? (
                <button
                  onClick={handleAssignGym}
                  disabled={actionLoading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Assign to {decodeURIComponent(telecallerName || 'Telecaller')}
                </button>
              ) : (
                <button
                  onClick={handleUnassignGym}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                  Unassign
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}