'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Download,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerCallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    outcome: 'all',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCalls();
  }, [filters, pagination.page]);

  const fetchCalls = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.outcome !== 'all') params.outcome = filters.outcome;

      const response = await api.get('/telecaller/calls-by-status', { params });
      setCalls(response.data.calls || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 20,
        total: response.data.total || 0,
        totalPages: response.data.total_pages || 1,
      });
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      setError('Failed to load call history');
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Gym Name', 'Location', 'Call Status', 'Remarks', 'Follow-up Date'];
    const csvData = calls.map(call => [
      new Date(call.created_at).toLocaleString(),
      call.gym_name || 'Unknown',
      `${call.gym?.city || 'Unknown'}, ${call.gym?.state || 'Unknown'}`,
      call.call_status,
      `"${(call.remarks || '').replace(/"/g, '""')}"`,
      call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_calls_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-900/30 text-gray-400', icon: Clock },
      contacted: { color: 'bg-blue-900/30 text-blue-400', icon: CheckCircle },
      interested: { color: 'bg-green-900/30 text-green-400', icon: CheckCircle },
      not_interested: { color: 'bg-red-900/30 text-red-400', icon: XCircle },
      follow_up_required: { color: 'bg-yellow-900/30 text-yellow-400', icon: AlertCircle },
      follow_up: { color: 'bg-blue-900/30 text-blue-400', icon: Clock },
      rejected: { color: 'bg-orange-900/30 text-orange-400', icon: XCircle },
      converted: { color: 'bg-purple-900/30 text-purple-400', icon: CheckCircle },
      no_response: { color: 'bg-gray-900/30 text-gray-400', icon: AlertCircle },
      closed: { color: 'bg-gray-700/30 text-gray-400', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.not_connected;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getOutcomeBadge = (outcome) => {
    const outcomeConfig = {
      interested: { color: 'bg-green-900/30 text-green-400' },
      not_interested: { color: 'bg-red-900/30 text-red-400' },
      follow_up: { color: 'bg-blue-900/30 text-blue-400' },
      follow_up_required: { color: 'bg-yellow-900/30 text-yellow-400' },
      no_response: { color: 'bg-gray-900/30 text-gray-400' },
      rejected: { color: 'bg-orange-900/30 text-orange-400' },
      converted: { color: 'bg-purple-900/30 text-purple-400' },
      pending: { color: 'bg-gray-900/30 text-gray-400' },
      contacted: { color: 'bg-blue-900/30 text-blue-400' },
      closed: { color: 'bg-gray-700/30 text-gray-400' },
    };

    const config = outcomeConfig[outcome] || outcomeConfig.no_response;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {outcome.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Call History</h1>
        <p className="text-gray-400 mt-2">View your call history and performance</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by gym name or notes..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-outline flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="follow_up_required">Follow-up Required</option>
                <option value="follow_up">Follow Up</option>
                <option value="no_response">No Response</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Outcome</label>
              <select
                value={filters.outcome}
                onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
                className="input-field w-full"
              >
                <option value="all">All Outcomes</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="follow_up_required">Follow-up Required</option>
                <option value="follow_up">Follow Up</option>
                <option value="no_response">No Response</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Call History Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-700/30">
                <th className="text-left p-4 font-medium text-gray-300">Date & Time</th>
                <th className="text-left p-4 font-medium text-gray-300">Gym Details</th>
                <th className="text-left p-4 font-medium text-gray-300">Status</th>
                <th className="text-left p-4 font-medium text-gray-300">Remarks</th>
                <th className="text-left p-4 font-medium text-gray-300">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    </div>
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    No call history found
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="text-white">
                        {formatDate(call.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-white font-medium">{call.gym_name || 'Unknown'}</div>
                          <div className="text-gray-400 text-sm">{call.gym?.city || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(call.call_status)}</td>
                    <td className="p-4">
                      <p className="text-gray-300 text-sm max-w-xs truncate" title={call.remarks}>
                        {call.remarks || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      {call.follow_up_date ? (
                        <div className="flex items-center text-blue-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(call.follow_up_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} calls
            </div>
            <div className="flex items-center gap-2">
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
    </div>
  );
}