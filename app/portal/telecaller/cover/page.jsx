'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  FileText,
  CreditCard,
  CalendarDays,
  Camera,
  Building2,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerCoverPage() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingGym, setEditingGym] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    document_uploaded: false,
    membership_plan_created: false,
    session_created: false,
    daily_pass_created: false,
    gym_studio_images_uploaded: false,
  });

  useEffect(() => {
    fetchConvertedGyms();
  }, [search]);

  const fetchConvertedGyms = async () => {
    setLoading(true);
    setError('');
    try {
      // First get assigned gyms
      const assignedResponse = await api.get('/telecaller/telecaller/assigned-gyms');
      const assignedGyms = assignedResponse.data.assigned_gyms || [];

      // For each gym, check if it has converted status
      const gymsWithStatus = await Promise.all(
        assignedGyms.map(async (gym) => {
          try {
            const convertedResponse = await api.get(`/telecaller/telecaller/gym/${gym.id}/converted-status`);
            return {
              ...gym,
              converted_status: convertedResponse.data,
            };
          } catch (err) {
            // If no converted status, return gym with null status
            return {
              ...gym,
              converted_status: null,
            };
          }
        })
      );

      // Filter only gyms with converted status
      const convertedGyms = gymsWithStatus.filter(gym => gym.converted_status !== null);
      setGyms(convertedGyms);
    } catch (error) {
      console.error('Failed to fetch converted gyms:', error);
      setError('Failed to load converted gyms');
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gym) => {
    setEditingGym(gym);
    setEditFormData({
      document_uploaded: gym.converted_status.document_uploaded,
      membership_plan_created: gym.converted_status.membership_plan_created,
      session_created: gym.converted_status.session_created,
      daily_pass_created: gym.converted_status.daily_pass_created,
      gym_studio_images_uploaded: gym.converted_status.gym_studio_images_uploaded,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.put(`/telecaller/telecaller/gym/${editingGym.id}/converted-status`, editFormData);

      setSuccess(`Updated converted status for ${editingGym.gym_name}`);
      setEditModalOpen(false);
      setEditingGym(null);

      // Refresh the list
      await fetchConvertedGyms();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update converted status');
    }
  };

  const getStatusProgress = (status) => {
    const fields = [
      { key: 'document_uploaded', label: 'Document', icon: FileText },
      { key: 'membership_plan_created', label: 'Membership Plan', icon: CreditCard },
      { key: 'session_created', label: 'Session', icon: CalendarDays },
      { key: 'daily_pass_created', label: 'Daily Pass', icon: Calendar },
      { key: 'gym_studio_images_uploaded', label: 'Studio Images', icon: Camera },
    ];

    const completedCount = fields.filter(field => status[field.key]).length;
    const progressPercentage = (completedCount / fields.length) * 100;

    return { fields, completedCount, progressPercentage };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Cover Tab - Converted Gyms</h1>
          <p className="text-gray-400">Update and manage converted gym details</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search converted gyms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Gyms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-full"></div>
              </div>
            ))
          ) : gyms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No converted gyms yet</h3>
              <p className="text-gray-500">Gyms marked as "Converted" will appear here</p>
            </div>
          ) : (
            gyms.map((gym) => {
              const { fields, completedCount, progressPercentage } = getStatusProgress(gym.converted_status);

              return (
                <div key={gym.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{gym.gym_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{gym.city}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(gym)}
                      className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit converted status"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Completion</span>
                      <span className="text-white">{completedCount}/{fields.length}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progressPercentage.toFixed(0)}% complete</p>
                  </div>

                  {/* Status Items */}
                  <div className="space-y-2 mb-4">
                    {fields.map((field) => {
                      const Icon = field.icon;
                      const isCompleted = gym.converted_status[field.key];

                      return (
                        <div
                          key={field.key}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            isCompleted ? 'bg-green-900/20 border border-green-800' : 'bg-gray-700/30 border border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`text-sm ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                              {field.label}
                            </span>
                          </div>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(gym.converted_status.updated_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Edit Converted Status - {editingGym.gym_name}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { key: 'document_uploaded', label: 'Document Uploaded', icon: FileText },
                { key: 'membership_plan_created', label: 'Membership Plan Created', icon: CreditCard },
                { key: 'session_created', label: 'Session Created', icon: CalendarDays },
                { key: 'daily_pass_created', label: 'Daily Pass Created', icon: Calendar },
                { key: 'gym_studio_images_uploaded', label: 'Gym Studio Images Uploaded', icon: Camera },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={editFormData[item.key]}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={item.key} className="text-sm font-medium text-gray-300 flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="btn-outline text-gray-400 border-gray-600 hover:bg-gray-700/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}