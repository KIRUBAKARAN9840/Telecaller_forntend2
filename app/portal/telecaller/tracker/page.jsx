'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  CalendarDays,
  Calendar,
  Camera,
  Edit,
  Save,
  X,
} from 'lucide-react';
import api from '@/lib/axios';

const TABS = [
  { id: 'pending', name: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'yellow' },
  { id: 'follow_up', name: 'Follow-up', icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
  { id: 'converted', name: 'Converted', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
  { id: 'rejected', name: 'Rejected', icon: <XCircle className="w-5 h-5" />, color: 'red' },
  { id: 'no_response', name: 'No Response', icon: <Phone className="w-5 h-5" />, color: 'gray' }
];

export default function Tracker() {
  const [activeTab, setActiveTab] = useState('pending');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConvertedEditModal, setShowConvertedEditModal] = useState(false);
  const [showConvertedModal, setShowConvertedModal] = useState(false);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);
  const [editFormData, setEditFormData] = useState({
    document_uploaded: false,
    membership_plan_created: false,
    session_created: false,
    daily_pass_created: false,
    gym_studio_images_uploaded: false,
  });
  const [editingConvertedGym, setEditingConvertedGym] = useState(null);

  // Form state for call modal
  const [formData, setFormData] = useState({
    interest_level: '',
    total_members: '',
    new_contact_number: '',
    feature_explained: false,
    remarks: '',
  });
  const [convertedStatusData, setConvertedStatusData] = useState({
    document_uploaded: false,
    membership_plan_created: false,
    session_created: false,
    daily_pass_created: false,
    gym_studio_images_uploaded: false,
  });
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    fetchGyms();
  }, [activeTab]);

  const fetchGyms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/telecaller/telecaller/gyms?status=${activeTab}`);
      setGyms(response.data.gyms || []);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch gyms: ' + (error.response?.data?.detail || error.message));
      }
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallClick = (gym) => {
    setSelectedGym(gym);
    setShowCallModal(true);

    // Pre-fill form with last call data if available
    if (gym.last_call_details) {
      setFormData({
        interest_level: gym.last_call_details.interest_level || '',
        total_members: gym.last_call_details.total_members || '',
        new_contact_number: gym.last_call_details.new_contact_number || '',
        feature_explained: gym.last_call_details.feature_explained || false,
        remarks: '', // Always start with empty remarks for new entry
      });

      // Pre-fill converted status if available
      if (gym.last_call_details.converted_status) {
        setConvertedStatusData({
          document_uploaded: gym.last_call_details.converted_status.document_uploaded || false,
          membership_plan_created: gym.last_call_details.converted_status.membership_plan_created || false,
          session_created: gym.last_call_details.converted_status.session_created || false,
          daily_pass_created: gym.last_call_details.converted_status.daily_pass_created || false,
          gym_studio_images_uploaded: gym.last_call_details.converted_status.gym_studio_images_uploaded || false,
        });
      } else {
        setConvertedStatusData({
          document_uploaded: false,
          membership_plan_created: false,
          session_created: false,
          daily_pass_created: false,
          gym_studio_images_uploaded: false,
        });
      }
    } else {
      // Reset form data if no previous call data
      setFormData({
        interest_level: '',
        total_members: '',
        new_contact_number: '',
        feature_explained: false,
        remarks: '',
      });
      setConvertedStatusData({
        document_uploaded: false,
        membership_plan_created: false,
        session_created: false,
        daily_pass_created: false,
        gym_studio_images_uploaded: false,
      });
    }

    setFollowUpDate('');
    setError(null);
  };

  const handleEditConvertedStatus = async (gym) => {
    try {
      // Fetch current converted status
      const response = await api.get(`/telecaller/telecaller/gym/${gym.gym_id}/converted-status`);
      setEditingConvertedGym(gym);
      setEditFormData({
        document_uploaded: response.data.document_uploaded,
        membership_plan_created: response.data.membership_plan_created,
        session_created: response.data.session_created,
        daily_pass_created: response.data.daily_pass_created,
        gym_studio_images_uploaded: response.data.gym_studio_images_uploaded,
      });
      setShowConvertedEditModal(true);
    } catch (error) {
      console.error('Failed to fetch converted status:', error);
      setError('Failed to load converted status details');
    }
  };

  const handleSaveConvertedStatus = async () => {
    try {
      await api.put(`/telecaller/telecaller/gym/${editingConvertedGym.gym_id}/converted-status`, editFormData);

      setShowConvertedEditModal(false);
      setEditingConvertedGym(null);

      // Refresh gyms list
      await fetchGyms();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update converted status');
    }
  };

  const handleStatusSubmit = async (status, remarks = null, followUpDate = null) => {
    // If no remarks passed, use formData.remarks
    const finalRemarks = remarks || formData.remarks;

    // If status is "No Response", submit directly without converted status
    if (status === 'no_response') {
      try {
        const payload = {
          gym_id: selectedGym.gym_id,
          status,
          call_form: {
            interest_level: formData.interest_level || null,
            total_members: formData.total_members ? parseInt(formData.total_members) : null,
            new_contact_number: formData.new_contact_number || null,
            feature_explained: formData.feature_explained,
            remarks: finalRemarks,
          },
          follow_up_date: followUpDate || null,
        };

        await api.post('/telecaller/telecaller/update-gym-status', payload);

        setShowCallModal(false);
        setSelectedGym(null);

        // Refresh gyms to update status
        await fetchGyms();
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to update status');
      }
      return;
    }

    // If status is "Converted", always show the modal
    if (status === 'converted') {
      setShowCallModal(false);
      setShowConvertedModal(true);
      return;
    }

    // Submit with converted status data
    try {
      const payload = {
        gym_id: selectedGym.gym_id,
        status,
        call_form: {
          interest_level: formData.interest_level || null,
          total_members: formData.total_members ? parseInt(formData.total_members) : null,
          new_contact_number: formData.new_contact_number || null,
          feature_explained: formData.feature_explained,
          remarks: finalRemarks,
        },
        follow_up_date: followUpDate || null,
        converted_status: status === 'converted' ? convertedStatusData : null,
      };

      await api.post('/telecaller/telecaller/update-gym-status', payload);

      setShowCallModal(false);
      setShowConvertedModal(false);
      setSelectedGym(null);

      // Refresh gyms to update status
      await fetchGyms();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update status');
    }
  };

  
  const handleViewHistory = async (gym) => {
    setSelectedGym(gym);
    setLoadingHistory(true);
    setFollowUpHistory([]);
    setShowHistoryModal(true);

    try {
      const response = await api.get(`/telecaller/telecaller/gym/${gym.gym_id}/follow-up-history`);
      setFollowUpHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch follow-up history:', error);
      setError('Failed to fetch follow-up history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Call Tracker</h1>
        <p className="text-gray-400">Track and manage your gym call activities</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex space-x-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `${tab.color === 'yellow' ? 'border-yellow-500 text-yellow-400' :
                     tab.color === 'blue' ? 'border-blue-500 text-blue-400' :
                     tab.color === 'green' ? 'border-green-500 text-green-400' :
                     tab.color === 'red' ? 'border-red-500 text-red-400' :
                     'border-gray-500 text-gray-400'}`
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      
      {/* Gyms Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : gyms.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No gyms found in {activeTab}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gyms.map((gym) => (
            <div key={gym.gym_id} className="bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 flex flex-col h-full">
              {/* Header Section */}
              <div className="p-4 pb-2">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold text-lg flex-1 pr-2">{gym.gym_name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 whitespace-nowrap`}>
                    {TABS.find(t => t.id === gym.call_status)?.name || gym.call_status}
                  </span>
                </div>
              </div>

              {/* Content Section - Can grow */}
              <div className="px-4 pb-2 flex-grow">
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Phone:</span> {gym.contact_number}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">City:</span> {gym.city}
                  </p>
                  {gym.last_call_date && (
                    <p className="text-gray-300">
                      <span className="text-gray-400">Last Call:</span> {formatDate(gym.last_call_date)}
                    </p>
                  )}
                  {gym.follow_up_date && gym.call_status === 'follow_up' && (
                    <p className="text-blue-400">
                      <span className="text-gray-400">Follow-up:</span> {formatDate(gym.follow_up_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Fixed Button Section - Always at bottom */}
              <div className="p-4 pt-2 mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCallClick(gym)}
                    className="flex-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors py-2 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={gym.call_status === 'rejected'}
                  >
                    {gym.call_status === 'rejected'
                      ? 'Status Closed'
                      : <><Phone className="inline w-4 h-4 mr-2" /> Log Call</>
                    }
                  </button>
                  {gym.call_status === 'converted' && (
                    <button
                      onClick={() => handleEditConvertedStatus(gym)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                      title="Edit Converted Status"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleViewHistory(gym)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                    title="View Follow-up History"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Log Call - {selectedGym.gym_name}
            </h3>

            {/* Form Fields */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interest Level
                </label>
                <select
                  value={formData.interest_level}
                  onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select Interest Level</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Members
                </label>
                <input
                  type="number"
                  value={formData.total_members}
                  onChange={(e) => setFormData({ ...formData, total_members: e.target.value })}
                  placeholder="Enter total members"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.new_contact_number}
                  onChange={(e) => setFormData({ ...formData, new_contact_number: e.target.value })}
                  placeholder="Enter new contact number"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature_explained"
                  checked={formData.feature_explained}
                  onChange={(e) => setFormData({ ...formData, feature_explained: e.target.checked })}
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="feature_explained" className="text-sm font-medium text-gray-300">
                  Feature Explained
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                {/* Show previous remark if available */}
                {selectedGym?.last_call_details?.remarks && (
                  <div className="mb-2 p-2 bg-gray-700 rounded text-sm text-gray-400">
                    <span className="text-xs text-gray-500">Previous remark:</span>
                    <p>{selectedGym.last_call_details.remarks}</p>
                  </div>
                )}
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter call details and outcome..."
                  className="w-full h-32 p-2 bg-gray-700 border border-gray-600 rounded text-white resize-none"
                  required
                />
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowFollowUpDatePicker(true)}
                  disabled={!formData.remarks.trim()}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Follow Up
                </button>
                <button
                  onClick={() => handleStatusSubmit('converted')}
                  disabled={!formData.remarks.trim()}
                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Converted
                </button>
                <button
                  onClick={() => handleStatusSubmit('rejected')}
                  disabled={!formData.remarks.trim()}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rejected
                </button>
                <button
                  onClick={() => handleStatusSubmit('no_response')}
                  className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  No Response
                </button>
              </div>
            </div>

            {/* Follow-up Date Picker Overlay */}
            {showFollowUpDatePicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Schedule Follow-up
                  </h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Follow-up Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowFollowUpDatePicker(false);
                        setFollowUpDate('');
                      }}
                      className="flex-1 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (followUpDate) {
                          handleStatusSubmit('follow_up', null, followUpDate);
                          setShowFollowUpDatePicker(false);
                          setFollowUpDate('');
                        }
                      }}
                      disabled={!followUpDate}
                      className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Converted Status Modal */}
      {showConvertedModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">
              Conversion Details - {selectedGym.gym_name}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 mr-2" />
                  Document
                </label>
                <input
                  type="checkbox"
                  checked={convertedStatusData.document_uploaded}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, document_uploaded: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Membership Plan
                </label>
                <input
                  type="checkbox"
                  checked={convertedStatusData.membership_plan_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, membership_plan_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Session
                </label>
                <input
                  type="checkbox"
                  checked={convertedStatusData.session_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, session_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  Daily Pass
                </label>
                <input
                  type="checkbox"
                  checked={convertedStatusData.daily_pass_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, daily_pass_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <Camera className="w-4 h-4 mr-2" />
                  Studio Images
                </label>
                <input
                  type="checkbox"
                  checked={convertedStatusData.gym_studio_images_uploaded}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, gym_studio_images_uploaded: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConvertedModal(false);
                  setShowCallModal(true);
                }}
                className="flex-1 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStatusSubmit('converted')}
                className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Save Converted
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit Converted Status Modal */}
      {showConvertedEditModal && editingConvertedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Edit Converted Status - {editingConvertedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowConvertedEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 mr-2" />
                  Document Uploaded
                </label>
                <input
                  type="checkbox"
                  checked={editFormData.document_uploaded}
                  onChange={(e) => setEditFormData({ ...editFormData, document_uploaded: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Membership Plan Created
                </label>
                <input
                  type="checkbox"
                  checked={editFormData.membership_plan_created}
                  onChange={(e) => setEditFormData({ ...editFormData, membership_plan_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Session Created
                </label>
                <input
                  type="checkbox"
                  checked={editFormData.session_created}
                  onChange={(e) => setEditFormData({ ...editFormData, session_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  Daily Pass Created
                </label>
                <input
                  type="checkbox"
                  checked={editFormData.daily_pass_created}
                  onChange={(e) => setEditFormData({ ...editFormData, daily_pass_created: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <Camera className="w-4 h-4 mr-2" />
                  Gym Studio Images Uploaded
                </label>
                <input
                  type="checkbox"
                  checked={editFormData.gym_studio_images_uploaded}
                  onChange={(e) => setEditFormData({ ...editFormData, gym_studio_images_uploaded: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConvertedEditModal(false)}
                className="flex-1 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConvertedStatus}
                className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up History Modal */}
      {showHistoryModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Follow-up History - {selectedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : followUpHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No follow-up history found</p>
            ) : (
              <div className="space-y-3">
                {followUpHistory.map((log, index) => (
                  <div
                    key={log.log_id}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">
                          {log.call_status.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.call_status === 'converted'
                          ? 'bg-green-900/30 text-green-400'
                          : log.call_status === 'follow_up'
                          ? 'bg-blue-900/30 text-blue-400'
                          : log.call_status === 'rejected'
                          ? 'bg-red-900/30 text-red-400'
                          : log.call_status === 'no_response'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {log.call_status.replace('_', ' ')}
                      </span>
                    </div>
                    {log.remarks && (
                      <p className="text-gray-300 text-sm">{log.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}