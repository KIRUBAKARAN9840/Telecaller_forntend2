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
  Plus,
  UserMinus,
  Info,
} from 'lucide-react';
import api from '@/lib/axios';
import DatePicker from '@/app/portal/components/DatePicker';

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
  const [selectedGyms, setSelectedGyms] = useState([]);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [unassignError, setUnassignError] = useState('');
  const [showMultiSelectOptions, setShowMultiSelectOptions] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedGymAddress, setSelectedGymAddress] = useState(null);

  // Filter states
  const [cityFilter, setCityFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [cityAreaMap, setCityAreaMap] = useState({}); // Map of city -> areas array
  const [filtersLoading, setFiltersLoading] = useState(false);

  useEffect(() => {
    if (!telecallerId) {
      setError('No telecaller selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchGyms();
    fetchAssignments();
    fetchAllCitiesAndAreas();
  }, [telecallerId]);

  const fetchGyms = async () => {
    console.log('🔍 fetchGyms called');
    console.log('Current params:', {
      page: pagination.page,
      limit: pagination.limit,
      search: search,
      cityFilter,
      areaFilter
    });

    try {
      console.log('📡 Making API request to /telecaller/manager/gyms/all');
      const response = await api.get('/telecaller/manager/gyms/all', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search,
          city: cityFilter || undefined,
          area: areaFilter || undefined
        }
      });

      console.log('✅ API Response:', response.status);
      console.log('📊 Response data:', response.data);

      setGyms(response.data.gyms || []);

      // Update pagination totals
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.total_pages || 1,
      }));
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

  // Effect to fetch gyms when city or area filter changes
  useEffect(() => {
    if (!telecallerId) return;

    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchGyms();
  }, [cityFilter, areaFilter]);

  // Effect to reset area filter when city changes
  useEffect(() => {
    // Reset area filter when city changes
    setAreaFilter('');
  }, [cityFilter]);

  // Effect to fetch gyms when page changes
  useEffect(() => {
    if (telecallerId && pagination.page > 0 && search === '') {
      fetchGyms();
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

  const fetchAllCitiesAndAreas = async () => {
    console.log('🔍 fetchAllCitiesAndAreas called');
    setFiltersLoading(true);

    try {
      const allCitiesSet = new Set();
      const cityAreasMap = {}; // Will store city -> Set of areas mapping
      let page = 1;
      let hasMorePages = true;

      // Fetch all pages to accumulate unique cities and areas
      while (hasMorePages) {
        console.log(`📡 Fetching page ${page} for cities/areas`);
        const response = await api.get('/telecaller/manager/gyms/all', {
          params: {
            page: page,
            limit: 100 // Use higher limit to fetch faster
          }
        });

        const gyms = response.data.gyms || [];

        // Accumulate cities and areas by city
        gyms.forEach(gym => {
          if (gym.city) {
            allCitiesSet.add(gym.city);

            // Initialize area set for this city if not exists
            if (!cityAreasMap[gym.city]) {
              cityAreasMap[gym.city] = new Set();
            }

            // Add area to this city's set
            if (gym.area) {
              cityAreasMap[gym.city].add(gym.area);
            }
          }
        });

        // Check if there are more pages
        const totalPages = response.data.total_pages || 1;
        hasMorePages = page < totalPages;
        page++;
      }

      // Convert Sets to sorted arrays
      const citiesArray = Array.from(allCitiesSet).sort();

      // Convert cityAreasMap Sets to sorted arrays
      const cityAreasMapArray = {};
      Object.keys(cityAreasMap).forEach(city => {
        cityAreasMapArray[city] = Array.from(cityAreasMap[city]).sort();
      });

      console.log('✅ Total unique cities:', citiesArray.length);
      console.log('✅ City areas map:', Object.keys(cityAreasMapArray).length, 'cities with areas');

      setAllCities(citiesArray);
      setCityAreaMap(cityAreasMapArray);
    } catch (error) {
      console.error('❌ Failed to fetch cities/areas:', error);
    } finally {
      setFiltersLoading(false);
    }
  };

  const isGymAssigned = (gymId) => {
    return assignments.some(assignment => assignment.gym_id === gymId);
  };

  const getAssignmentDetails = (gymId) => {
    return assignments.find(assignment => assignment.gym_id === gymId);
  };

  const handleGymClick = (gym) => {
    const isAssigned = isGymAssigned(gym.id);

    if (isAssigned) {
      // For assigned gyms, show details modal like before
      setSelectedGyms([{
        ...gym,
        isAssigned: true,
        assignment: getAssignmentDetails(gym.id)
      }]);
      setShowModal(true);
    } else {
      // For unassigned gyms, toggle selection
      const gymId = gym.id;
      setSelectedGyms(prev => {
        const index = prev.findIndex(g => g.id === gymId);
        if (index > -1) {
          return prev.filter(g => g.id !== gymId);
        } else {
          return [...prev, {
            ...gym,
            isAssigned: false,
            assignment: null
          }];
        }
      });
    }
  };

  const handleAssignGyms = async () => {
    if (selectedGyms.length === 0) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      // Assign all selected gyms using bulk endpoint
      const unassignedGyms = selectedGyms.filter(gym => !gym.isAssigned);

      const response = await api.post('/telecaller/manager/bulk-assign-gyms', {
        telecaller_id: telecallerId,
        gym_ids: unassignedGyms.map(gym => gym.id),
        target_date: targetDate || null
      });

      setSuccess(`Successfully assigned ${unassignedGyms.length} gym${unassignedGyms.length > 1 ? 's' : ''} to ${decodeURIComponent(telecallerName || 'Telecaller')}`);

      // Refresh data
      await fetchAssignments();
      await fetchGyms();

      setShowModal(false);
      setSelectedGyms([]);
      setTargetDate('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to assign gyms');
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGyms([]);
    setTargetDate('');
  };

  const selectMultipleGyms = (count) => {
    const unassignedGyms = filteredGyms.filter(gym => !isGymAssigned(gym.id));
    const alreadySelectedIds = selectedGyms.map(g => g.id);

    // Get unassigned gyms that are not already selected
    const availableGyms = unassignedGyms.filter(gym => !alreadySelectedIds.includes(gym.id));

    // Select the requested number of gyms (or fewer if not enough available)
    const toSelect = availableGyms.slice(0, Math.min(count, availableGyms.length));
    const newGyms = toSelect.map(gym => ({
      ...gym,
      isAssigned: false,
      assignment: null
    }));

    setSelectedGyms(prev => [...prev, ...newGyms]);
    setShowMultiSelectOptions(false);
  };

  const getAvailableGymCount = () => {
    const unassignedGyms = filteredGyms.filter(gym => !isGymAssigned(gym.id));
    const alreadySelectedIds = selectedGyms.map(g => g.id);
    const availableGyms = unassignedGyms.filter(gym => !alreadySelectedIds.includes(gym.id));
    return availableGyms.length;
  };

  const unselectAllGyms = () => {
    setSelectedGyms([]);
  };

  const handleUnassignGym = () => {
    if (!selectedGyms[0] || !selectedGyms[0].isAssigned) return;

    // Check if the gym can be unassigned based on its current status
    const currentStatus = selectedGyms[0].assignment?.current_call_status || 'pending';
    const allowedStatuses = ['pending', 'no_response'];

    if (!allowedStatuses.includes(currentStatus)) {
      setUnassignError(`Cannot unassign gym. Current status is "${currentStatus}". Only gyms with status 'pending' or 'no_response' can be unassigned.`);
      setShowUnassignModal(true);
      return;
    }

    setUnassignError('');
    setShowUnassignModal(true);
  };

  const handleViewAddress = (e, gym) => {
    e.stopPropagation(); // Prevent row click
    setSelectedGymAddress(gym);
    setShowAddressModal(true);
  };

  const confirmUnassignGym = async () => {
    if (!selectedGyms[0] || !selectedGyms[0].isAssigned) return;

    setActionLoading(true);
    setError('');
    setSuccess('');
    setUnassignError('');

    try {
      await api.post('/telecaller/manager/unassign-gym', {
        gym_id: selectedGyms[0].id
      });

      setSuccess(`Successfully unassigned ${selectedGyms[0].gym_name}`);

      // Refresh data
      await fetchAssignments();
      await fetchGyms();

      setShowModal(false);
      setShowUnassignModal(false);
      setSelectedGyms([]);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to unassign gym');
      setUnassignError(error.response?.data?.detail || 'Failed to unassign gym');
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

  // Filter gyms based on search only (city and area are now filtered on server side)
  const filteredGyms = sortedGyms.filter((gym) => {
    // Search filter (client-side for immediate feedback)
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        gym.gym_name?.toLowerCase().includes(searchLower) ||
        gym.city?.toLowerCase().includes(searchLower) ||
        gym.area?.toLowerCase().includes(searchLower) ||
        gym.contact_number?.includes(search);
      if (!matchesSearch) return false;
    }

    return true;
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
        <p className="text-gray-400 mt-2">Click on gyms to select them, then use the Assign button to assign selected gyms</p>
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

      {/* Multi-select Actions Bar (appears when gyms are selected) */}
      {selectedGyms.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {selectedGyms.length} gym{selectedGyms.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={unselectAllGyms}
                className="text-gray-400 hover:text-white text-sm"
              >
                Unselect All
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Multi-select dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMultiSelectOptions(!showMultiSelectOptions)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                >
                  Quick Select
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showMultiSelectOptions ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMultiSelectOptions && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <div className="text-xs text-gray-400 px-3 py-1 mb-1">
                        {getAvailableGymCount()} unassigned gyms available
                      </div>
                      {getAvailableGymCount() > 0 && (
                        <>
                          {getAvailableGymCount() >= 5 && (
                            <button
                              onClick={() => selectMultipleGyms(5)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                            >
                              Select 5 more
                            </button>
                          )}
                          {getAvailableGymCount() >= 10 && (
                            <button
                              onClick={() => selectMultipleGyms(10)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                            >
                              Select 10 more
                            </button>
                          )}
                          {getAvailableGymCount() >= 25 && (
                            <button
                              onClick={() => selectMultipleGyms(25)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                            >
                              Select 25 more
                            </button>
                          )}
                          {getAvailableGymCount() >= 50 && (
                            <button
                              onClick={() => selectMultipleGyms(50)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                            >
                              Select 50 more
                            </button>
                          )}
                          <button
                            onClick={() => selectMultipleGyms(getAvailableGymCount())}
                            className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-gray-700 rounded font-medium"
                          >
                            Select All ({getAvailableGymCount()})
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={openAssignModal}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Assign to {decodeURIComponent(telecallerName || 'Telecaller')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search gyms by name, city, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* City Filter */}
          <div className="flex-1 min-w-[150px] max-w-[200px]">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="input-field w-full"
              disabled={filtersLoading}
            >
              <option value="">All Cities</option>
              {allCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div className="flex-1 min-w-[150px] max-w-[200px]">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="input-field w-full"
              disabled={filtersLoading || !cityFilter}
            >
              <option value="">All Areas</option>
              {cityFilter && cityAreaMap[cityFilter] && cityAreaMap[cityFilter].map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(search || cityFilter || areaFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setCityFilter('');
                setAreaFilter('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Gyms Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Gym Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Phone Number
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredGyms.map((gym) => {
                const isAssigned = isGymAssigned(gym.id);
                const assignment = getAssignmentDetails(gym.id);
                const isSelected = selectedGyms.some(g => g.id === gym.id);

                return (
                  <tr
                    key={gym.id}
                    onClick={() => handleGymClick(gym)}
                    className={`cursor-pointer transition-colors ${
                      isAssigned
                        ? 'opacity-60 bg-gray-800/50 hover:bg-gray-700/50'
                        : isSelected
                        ? 'ring-2 ring-red-500 bg-red-900/20 hover:bg-red-900/30'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Gym Details Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{gym.gym_name}</h3>
                              {isAssigned && assignment && (
                                <div className="text-xs text-gray-400 mt-1">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{assignment.telecaller_name}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {!isAssigned && isSelected && (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white transform rotate-45" />
                            </div>
                          )}
                          {isAssigned && (
                            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
                              Assigned
                            </span>
                          )}
                          <button
                            onClick={(e) => handleViewAddress(e, gym)}
                            className="text-gray-400 hover:text-blue-400 transition-colors flex items-center p-1"
                            title="View Full Address"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Location Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{gym.city || 'No location'}</span>
                      </div>
                    </td>

                    {/* Phone Number Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{gym.contact_number || 'No phone'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredGyms.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No gyms found</p>
        </div>
      )}

      {/* Pagination - Show when there are multiple pages (regardless of filters) */}
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

      {/* Filtered results count - show only when searching (not for city/area filters as they have pagination) */}
      {!loading && search !== '' && (
        <div className="flex items-center justify-between mt-6 mb-8">
          <div className="text-sm text-gray-400">
            Found {filteredGyms.length} gyms matching "{search}"
          </div>
        </div>
      )}

      {/* Assignment Confirmation Modal */}
      {showModal && selectedGyms.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {selectedGyms[0]?.isAssigned ? 'Gym Details' : `Assign ${selectedGyms.length} Gym${selectedGyms.length > 1 ? 's' : ''} to ${decodeURIComponent(telecallerName || 'Telecaller')}`}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {selectedGyms[0]?.isAssigned ? (
              // Single assigned gym details view (like before)
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-white font-medium text-lg">{selectedGyms[0].gym_name}</h4>
                  <p className="text-gray-400">{selectedGyms[0].city}</p>
                </div>

                <div className="text-sm text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>{selectedGyms[0].contact_number}</span>
                  </div>
                </div>

                {selectedGyms[0].assignment && (
                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <h5 className="text-yellow-400 font-medium mb-2">Currently Assigned</h5>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>To: {selectedGyms[0].assignment.telecaller_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>By: Manager ID {selectedGyms[0].assignment.manager_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Assigned: {new Date(selectedGyms[0].assignment.assigned_at).toLocaleDateString()}</span>
                      </div>
                      {selectedGyms[0].assignment.target_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Target: {new Date(selectedGyms[0].assignment.target_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedGyms[0].assignment.current_call_status === 'pending' ? 'bg-gray-900/50 text-gray-400' :
                          selectedGyms[0].assignment.current_call_status === 'no_response' ? 'bg-gray-900/50 text-gray-400' :
                          selectedGyms[0].assignment.current_call_status === 'follow_up' ? 'bg-blue-900/50 text-blue-400' :
                          selectedGyms[0].assignment.current_call_status === 'converted' ? 'bg-green-900/50 text-green-400' :
                          selectedGyms[0].assignment.current_call_status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {selectedGyms[0].assignment.current_call_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Multiple unassigned gyms for assignment
              <div className="space-y-4 mb-6">
                <div className="text-gray-300">
                  <p>You have selected {selectedGyms.length} gym{selectedGyms.length > 1 ? 's' : ''} for assignment:</p>
                </div>

                {/* List of selected gyms */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGyms.map((gym) => (
                    <div key={gym.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{gym.gym_name}</h4>
                          <p className="text-gray-400 text-sm">{gym.city || 'No location'}</p>
                        </div>
                        {gym.isAssigned ? (
                          <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
                            Already Assigned
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                            Will be Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning about already assigned gyms */}
                {selectedGyms.some(gym => gym.isAssigned) && (
                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      Note: Some selected gyms are already assigned and will be skipped.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Date Picker for Assignment */}
            {!selectedGyms[0]?.isAssigned && selectedGyms.some(gym => !gym.isAssigned) && (
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-medium text-gray-300">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Target Date for Assignment
                </label>
                <DatePicker
                  value={targetDate}
                  onChange={setTargetDate}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Max 1 year from now
                />
                <p className="text-xs text-gray-400">
                  Select the date for which this assignment is scheduled. Click "Today" for instant assignment.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Close
              </button>

              {selectedGyms[0]?.isAssigned ? (
                // Assigned gym - show unassign button if status allows
                (() => {
                  const currentStatus = selectedGyms[0].assignment?.current_call_status || 'pending';
                  const canUnassign = ['pending', 'no_response'].includes(currentStatus);
                  return canUnassign ? (
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
                  ) : null;
                })()
              ) : (
                // Unassigned gyms - show assign button
                selectedGyms.some(gym => !gym.isAssigned) && (
                  <button
                    onClick={handleAssignGyms}
                    disabled={actionLoading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Assign {selectedGyms.filter(gym => !gym.isAssigned).length} Gym{selectedGyms.filter(gym => !gym.isAssigned).length > 1 ? 's' : ''}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && selectedGymAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
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
                <p className="text-sm font-medium text-gray-400">Location</p>
                <p className="text-white">
                  {selectedGymAddress.city || 'N/A'}
                </p>
              </div>

              {selectedGymAddress.address && (
                <div>
                  <p className="text-sm font-medium text-gray-400">Full Address</p>
                  <p className="text-white">
                    {selectedGymAddress.address}
                  </p>
                </div>
              )}

              {selectedGymAddress.area && (
                <div>
                  <p className="text-sm font-medium text-gray-400">Area</p>
                  <p className="text-white">
                    {selectedGymAddress.area}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirmation Modal */}
      {showUnassignModal && selectedGyms[0] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {unassignError ? 'Cannot Unassign Gym' : 'Confirm Unassignment'}
              </h3>
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setUnassignError('');
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {unassignError ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-400">{unassignError}</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-300">
                    Are you sure you want to unassign <strong>{selectedGyms[0].gym_name}</strong>?
                  </p>
                  <p className="text-gray-400 text-sm">
                    This gym will become available for assignment to other telecallers.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setUnassignError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>

              {!unassignError && (
                <button
                  onClick={confirmUnassignGym}
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