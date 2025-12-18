'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/portal/components/common/StatCard';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  CheckCircle,
  Target,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Award,
  Activity,
  DollarSign,
  BarChart3,
  PieChart,
} from 'lucide-react';
import api from '@/lib/axios';

export default function ManagerPerformance() {
  const [performanceOverview, setPerformanceOverview] = useState(null);
  const [telecallerStats, setTelecallerStats] = useState([]);
  const [conversionTrends, setConversionTrends] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, telecallersRes] = await Promise.all([
        api.get('/telecaller/manager/performance/overview'),
        api.get('/telecaller/manager/performance/telecaller-stats')
      ]);

      setPerformanceOverview({
        total_calls: overviewRes.data.total_calls_made,
        total_conversions: overviewRes.data.total_converted,
        avg_conversion_rate: overviewRes.data.overall_conversion_rate,
        connected_calls: Math.round(overviewRes.data.total_calls_made * 0.7), // Estimated
        interested_calls: Math.round(overviewRes.data.total_calls_made * 0.4), // Estimated
        period_comparison: {
          calls_change: 0, // TODO: implement period comparison
          conversions_change: 0,
          rate_change: 0
        }
      });

      setTelecallerStats(telecallersRes.data.telecaller_stats.map(t => ({
        id: t.telecaller_id,
        name: t.name,
        calls: t.calls_made,
        conversions: t.converted,
        rate: t.conversion_rate,
        revenue: t.converted * 2000 // Assuming ₹2000 per conversion
      })));

      setConversionTrends([]); // TODO: implement trends
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      setError('Failed to load performance data');

      // Set empty data on error
      setPerformanceOverview(null);
      setTelecallerStats([]);
      setConversionTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // Get call history for export
      const response = await api.get('/telecaller/manager/performance/call-history?limit=10000');

      // Create CSV content
      const headers = ['Telecaller', 'Gym Name', 'Call Status', 'Remarks', 'Follow-up Date', 'Created At'];
      const csvData = response.data.call_history.map(call => [
        call.telecaller_name || 'Unknown',
        call.gym_name,
        call.call_status,
        `"${(call.remarks || '').replace(/"/g, '""')}"`,
        call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString() : '',
        new Date(call.created_at).toLocaleString()
      ]);

      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Calls',
      value: performanceOverview?.total_calls?.toLocaleString() || '0',
      icon: <Phone className="w-8 h-8" />,
      color: 'blue',
      change: performanceOverview?.period_comparison?.calls_change
    },
    {
      title: 'Conversions',
      value: performanceOverview?.total_conversions?.toLocaleString() || '0',
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'green',
      change: performanceOverview?.period_comparison?.conversions_change
    },
    {
      title: 'Conversion Rate',
      value: `${performanceOverview?.avg_conversion_rate?.toFixed(1) || '0'}%`,
      icon: <Target className="w-8 h-8" />,
      color: 'yellow',
      change: performanceOverview?.period_comparison?.rate_change
    },
    // {
    //   title: 'Revenue Generated',
    //   value: `₹${(performanceOverview?.total_revenue || 0).toLocaleString()}`,
    //   icon: <DollarSign className="w-8 h-8" />,
    //   color: 'green',
    //   subtitle: 'Average per conversion: ₹2,000'
    // }
  ];

  const renderMiniChart = (data, metric) => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d[metric]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return (
      <div className="flex items-end space-x-1 h-12">
        {values.slice(-7).map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-red-500/30 hover:bg-red-500/50 transition-colors rounded-t"
            style={{ height: `${((value - min) / range) * 100}%` }}
          />
        ))}
      </div>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
            <p className="text-gray-400 mt-2">Track and analyze your team's performance metrics</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">Date Range:</span>
          </div>
          <div className="flex space-x-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range === '24h' ? 'Last 24 Hours' :
                 range === '7d' ? 'Last 7 Days' :
                 range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Conversion Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Conversion Trends</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Daily Conversion Rate</span>
              <span className="text-white font-medium">
                {performanceOverview?.avg_conversion_rate?.toFixed(1) || '0'}%
              </span>
            </div>
            {renderMiniChart(conversionTrends, 'rate')}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs">Peak Day</p>
                <p className="text-white font-semibold">
                  {conversionTrends.length > 0
                    ? Math.max(...conversionTrends.map(d => d.rate)).toFixed(1) + '%'
                    : '0%'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Average</p>
                <p className="text-white font-semibold">
                  {performanceOverview?.avg_conversion_rate?.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Trend</p>
                <p className={`font-semibold flex items-center justify-center ${
                  performanceOverview?.period_comparison?.rate_change >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {performanceOverview?.period_comparison?.rate_change >= 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(performanceOverview?.period_comparison?.rate_change || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call Volume */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Call Volume Analysis</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Calls</span>
              <span className="text-white font-medium">
                {performanceOverview?.total_calls?.toLocaleString() || '0'}
              </span>
            </div>
            {renderMiniChart(conversionTrends, 'calls')}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs">Peak Day</p>
                <p className="text-white font-semibold">
                  {conversionTrends.length > 0
                    ? Math.max(...conversionTrends.map(d => d.calls))
                    : '0'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Daily Avg</p>
                <p className="text-white font-semibold">
                  {conversionTrends.length > 0
                    ? Math.round(conversionTrends.reduce((sum, d) => sum + d.calls, 0) / conversionTrends.length)
                    : '0'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Trend</p>
                <p className={`font-semibold flex items-center justify-center ${
                  performanceOverview?.period_comparison?.calls_change >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {performanceOverview?.period_comparison?.calls_change >= 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(performanceOverview?.period_comparison?.calls_change || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Top Performers</h3>
          </div>
          <span className="text-sm text-gray-400">
            {telecallerStats.length} telecallers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3">Telecaller</th>
                <th className="pb-3 text-center">Calls</th>
                <th className="pb-3 text-center">Conversions</th>
                <th className="pb-3 text-center">Conversion Rate</th>
                <th className="pb-3 text-center">Revenue</th>
                <th className="pb-3 text-center">Performance</th>
              </tr>
            </thead>
            <tbody>
              {telecallerStats.map((telecaller, index) => (
                <tr key={telecaller.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {telecaller.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{telecaller.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-white">{telecaller.calls}</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-green-400 font-medium">{telecaller.conversions}</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`font-medium ${
                      telecaller.rate >= 15 ? 'text-green-400' :
                      telecaller.rate >= 10 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {telecaller.rate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-white">₹{telecaller.revenue.toLocaleString()}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center">
                      {index < 3 ? (
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-500/20 text-gray-300' :
                          'bg-orange-600/20 text-orange-400'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                      ) : (
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(telecaller.rate / 20) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Funnel */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Performance Funnel</h3>
          </div>
        </div>

        <div className="space-y-4">
          {(() => {
            const totalCalls = performanceOverview?.total_calls || 0;
            const connectedCalls = performanceOverview?.connected_calls || 0;
            const interestedCalls = performanceOverview?.interested_calls || 0;
            const convertedCalls = performanceOverview?.total_conversions || 0;

            return [
              {
                stage: 'Total Calls',
                value: totalCalls,
                percentage: totalCalls > 0 ? 100 : 0,
                color: 'bg-blue-500'
              },
              {
                stage: 'Connected',
                value: connectedCalls,
                percentage: totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0,
                color: 'bg-green-500'
              },
              {
                stage: 'Interested',
                value: interestedCalls,
                percentage: connectedCalls > 0 ? (interestedCalls / connectedCalls) * 100 : 0,
                color: 'bg-yellow-500'
              },
              {
                stage: 'Converted',
                value: convertedCalls,
                percentage: interestedCalls > 0 ? (convertedCalls / interestedCalls) * 100 : (performanceOverview?.avg_conversion_rate || 0),
                color: 'bg-red-500'
              }
            ];
          })().map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{stage.stage}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">{stage.value.toLocaleString()}</span>
                  <span className="text-gray-400">{stage.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}