'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/portal/components/common/StatCard';
import {
  Building2,
  Phone,
  Clock,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerDashboard() {
  const [stats, setStats] = useState(null);
  const [todayFollowups, setTodayFollowups] = useState([]);
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
      setStats(response.data);
      setError(null);

      // Fetch today's follow-ups
      try {
        const followupsResponse = await api.get('/telecaller/telecaller/followups/today');
        // Ensure response is an array
        setTodayFollowups(Array.isArray(followupsResponse.data) ? followupsResponse.data : []);
      } catch (followupError) {
        console.error('Failed to fetch follow-ups:', followupError);
        // Set empty array if follow-ups endpoint fails
        setTodayFollowups([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');

      // Fallback to mock data if API fails
      const mockStats = {
        assigned_gyms: 28,
        calls_today: 15,
        followups_today: 5,
        conversion_rate: 20.5,
      };

      const mockFollowups = [
        {
          id: 1,
          gym_name: 'FitZone Gym',
          contact_person: 'John Doe',
          phone: '9876543210',
          follow_up_time: '10:00 AM',
          notes: 'Interested in premium membership',
        },
        {
          id: 2,
          gym_name: 'PowerFit Center',
          contact_person: 'Jane Smith',
          phone: '9876543211',
          follow_up_time: '2:00 PM',
          notes: 'Follow up on pricing discussion',
        },
        {
          id: 3,
          gym_name: 'HealthHub',
          contact_person: 'Mike Johnson',
          phone: '9876543212',
          follow_up_time: '4:30 PM',
          notes: 'Schedule demo session',
        },
      ];

      setStats(mockStats);
      setTodayFollowups(mockFollowups);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Assigned Gyms',
      value: stats?.assigned_gyms || 0,
      icon: <Building2 className="w-8 h-8" />,
      color: 'blue',
      subtitle: 'Total in your list',
    },
    {
      title: 'Calls Today',
      value: stats?.calls_today || 0,
      icon: <Phone className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Follow-ups Today',
      value: stats?.followups_today || 0,
      icon: <Clock className="w-8 h-8" />,
      color: 'yellow',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversion_rate || 0}%`,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'green',
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

      {/* Today's Follow-ups */}
      <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Follow-ups</h3>
            <button className="text-red-500 hover:text-red-400 text-sm font-medium">
              View All
            </button>
          </div>

          {todayFollowups && Array.isArray(todayFollowups) && todayFollowups.length > 0 ? (
            <div className="space-y-4">
              {todayFollowups.map((followup) => (
                <div
                  key={followup.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{followup.gym_name}</h4>
                      <p className="text-gray-400 text-sm mt-1">{followup.contact_person}</p>
                      <p className="text-gray-500 text-sm">{followup.phone}</p>
                      {followup.notes && (
                        <p className="text-gray-400 text-xs mt-2 italic">{followup.notes}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="flex items-center text-yellow-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {followup.follow_up_time}
                      </div>
                      <button className="btn-primary btn-sm mt-2">
                        Call Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No follow-ups scheduled for today</p>
            </div>
          )}
      </div>
    </div>
  );
}