'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/portal/components/common/StatCard';
import {
  Phone,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const dashboardStats = response.data;

      // Fetch today's target count
      const todayTargetResponse = await api.get('/telecaller/telecaller/gyms?status=pending&target_date_filter=today');
      const todayTargetCount = todayTargetResponse.data.gyms?.length || 0;

      // Fetch today's converted count
      const todayConvertedResponse = await api.get('/telecaller/telecaller/gyms?status=converted&converted_filter=today');
      const todayConvertedCount = todayConvertedResponse.data.gyms?.length || 0;

      // Fetch today's rejected count
      const todayRejectedResponse = await api.get('/telecaller/telecaller/gyms?status=rejected&rejected_filter=today');
      const todayRejectedCount = todayRejectedResponse.data.gyms?.length || 0;

      // Fetch today's no response count
      const todayNoResponseResponse = await api.get('/telecaller/telecaller/gyms?status=no_response&no_response_filter=today');
      const todayNoResponseCount = todayNoResponseResponse.data.gyms?.length || 0;

      // Combine the stats
      const combinedStats = {
        ...dashboardStats,
        today_target: todayTargetCount,
        todays_converted: todayConvertedCount,
        todays_rejected: todayRejectedCount,
        todays_no_response: todayNoResponseCount,
      };

      setStats(combinedStats);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');

      // Fallback to mock data if API fails
      const mockStats = {
        assigned_gyms: 28,
        today_target: 12,
        calls_today: 15,
        followups_today: 5,
        conversion_rate: 20.5,
        todays_converted: 3,
        todays_rejected: 2,
        todays_no_response: 1,
      };

      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  
  const statsData = [
    {
      title: 'Today\'s Target',
      value: stats?.today_target || 0,
      icon: <Calendar className="w-8 h-8" />,
      color: 'purple',
    },
    {
      title: 'Follow-ups Today',
      value: stats?.followups_today || 0,
      icon: <Clock className="w-8 h-8" />,
      color: 'yellow',
    },
    {
      title: 'Calls Today',
      value: stats?.calls_today || 0,
      icon: <Phone className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Today\'s Converted',
      value: stats?.todays_converted || 0,
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Today\'s Rejected',
      value: stats?.todays_rejected || 0,
      icon: <XCircle className="w-8 h-8" />,
      color: 'red',
    },
    {
      title: 'Today\'s No Response',
      value: stats?.todays_no_response || 0,
      icon: <AlertCircle className="w-8 h-8" />,
      color: 'gray',
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

      </div>
  );
}

