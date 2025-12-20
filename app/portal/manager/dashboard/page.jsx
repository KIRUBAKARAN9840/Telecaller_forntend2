'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/portal/components/common/StatCard';
import {
  Users,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  PhoneOff,
  CalendarCheck,
  Target,
} from 'lucide-react';
import api from '@/lib/axios';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (!user || user.role !== 'manager') {
        window.location.href = '/';
        return;
      }
    } catch (e) {
      window.location.href = '/';
      return;
    }

    // Small delay to ensure localStorage is properly set
    setTimeout(() => {
      fetchDashboardStats();
    }, 100);

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/telecaller/manager/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }
      setError(`Failed to load dashboard data: ${error.response?.data?.detail || 'Authentication required'}`);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manager Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's your team's performance overview.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Telecallers"
          value={stats?.total_telecallers || 0}
          icon={<Users className="w-8 h-8" />}
          color="blue"
        />
        <StatCard
          title="Total Gyms Assigned"
          value={stats?.total_gyms_assigned || 0}
          icon={<Building2 className="w-8 h-8" />}
          color="green"
        />
        <StatCard
          title="Today's Followups"
          value={stats?.todays_followups || 0}
          icon={<CalendarCheck className="w-8 h-8" />}
          color="indigo"
        />
        <StatCard
          title="Today's Call Target"
          value={stats?.todays_call_target || 0}
          icon={<Target className="w-8 h-8" />}
          color="orange"
        />
        <StatCard
          title="Converted Today"
          value={stats?.converted_today || 0}
          icon={<CheckCircle className="w-8 h-8" />}
          color="purple"
        />
        <StatCard
          title="Total Follow-ups Pending"
          value={stats?.followups_pending || 0}
          icon={<Clock className="w-8 h-8" />}
          color="yellow"
        />
        <StatCard
          title="Rejected Today"
          value={stats?.rejected_today || 0}
          icon={<XCircle className="w-8 h-8" />}
          color="red"
        />
        <StatCard
          title="No Response Today"
          value={stats?.no_response_today || 0}
          icon={<PhoneOff className="w-8 h-8" />}
          color="gray"
        />
      </div>
    </div>
  );
}