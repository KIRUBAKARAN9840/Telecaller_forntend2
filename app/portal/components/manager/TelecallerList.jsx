'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Phone,
  Building2,
  Plus,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerList() {
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleAssignGym = (telecaller) => {
    // Navigate to gym assignment page for this telecaller
    window.location.href = `/portal/manager/assign-gym?telecallerId=${telecaller.id}&telecallerName=${encodeURIComponent(telecaller.name)}`;
  };
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Separate effect for search with page reset
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Pass current search value directly to avoid state issues
      fetchTelecallers(true, search);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Effect for page changes (not search)
  useEffect(() => {
    if (!search) { // Only fetch on page change if not searching
      fetchTelecallers();
    }
  }, [pagination.page]);

  const fetchTelecallers = async (resetPage = false, currentSearch = search) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (currentSearch) params.search = currentSearch;

      // Reset to page 1 if searching and not already on page 1
      let currentPage = pagination.page;
      if (resetPage && currentSearch && pagination.page !== 1) {
        currentPage = 1;
        setPagination(prev => ({ ...prev, page: 1 }));
      }

      params.page = currentPage;
      params.limit = pagination.limit;

      const response = await api.get('/telecaller/manager/dashboard/telecallers/list', { params });
      setTelecallers(Array.isArray(response.data.telecallers) ? response.data.telecallers : []);
      setPagination(prev => ({
        ...prev,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        totalPages: response.data.total_pages || 1,
      }));
    } catch (error) {
      console.error('Failed to fetch telecallers:', error);
      setError('Failed to load telecaller data');
      // Set empty data on error
      setTelecallers([]);
    } finally {
      setLoading(false);
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

  
  return (
    <div className="card">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Telecaller Team</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search telecallers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-4 font-medium text-gray-300">Name</th>
              <th className="text-left p-4 font-medium text-gray-300">Mobile</th>
              <th className="text-left p-4 font-medium text-gray-300">Assigned Gyms</th>
              <th className="text-left p-4 font-medium text-gray-300">Calls Today</th>
              <th className="text-left p-4 font-medium text-gray-300">Conversion Rate</th>
              <th className="text-left p-4 font-medium text-gray-300">Last Active</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {telecallers.map((telecaller) => (
              <tr
                key={telecaller.id}
                className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {telecaller.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{telecaller.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{telecaller.mobile_number}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{telecaller.assigned_gyms}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-300 font-medium">{telecaller.calls_today}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <span
                      className={`font-medium ${
                        telecaller.conversion_rate >= 20
                          ? 'text-green-400'
                          : telecaller.conversion_rate >= 15
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {telecaller.conversion_rate}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-400 text-sm">
                    {formatDate(telecaller.last_active)}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleAssignGym(telecaller)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Gym
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
                </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} telecallers
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}