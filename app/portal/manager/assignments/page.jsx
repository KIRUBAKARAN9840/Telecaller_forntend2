'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Building2,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/axios';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
    const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [search, pagination.page]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      params.page = pagination.page;
      params.limit = pagination.limit;

      const response = await api.get('/telecaller/manager/assignments', { params });
      setAssignments(response.data.assignments || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        totalPages: response.data.total_pages || 1,
      });
    } catch (error) {
      setError('Failed to fetch assignments');
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gym Assignments</h1>
        <p className="text-gray-400 mt-2">Manage gym assignments to telecallers</p>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="card p-4 mb-6">
        <div className="flex">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search gyms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No assignments found</p>
            <p className="text-gray-500 text-sm mt-2">
              All gyms are assigned to telecallers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 font-medium text-gray-300">Gym Details</th>
                  <th className="text-left p-4 font-medium text-gray-300">Telecaller</th>
                  <th className="text-left p-4 font-medium text-gray-300">Assigned On</th>
                  <th className="text-left p-4 font-medium text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{assignment.gym_name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {assignment.city || 'Unknown'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {assignment.contact_number || 'No phone'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            {assignment.telecaller_name || 'Unassigned'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {assignment.telecaller_mobile || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {assignment.assigned_at ? formatDate(assignment.assigned_at) : '-'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'active'
                            ? 'bg-green-900/50 text-green-400 border border-green-800'
                            : 'bg-orange-900/50 text-orange-400 border border-orange-800'
                        }`}
                      >
                        {assignment.status === 'active' ? 'Active' : 'Unassigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && assignments.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} assignments
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="p-2 rounded border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}