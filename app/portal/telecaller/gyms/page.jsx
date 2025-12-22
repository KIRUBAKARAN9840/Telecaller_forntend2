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
  Plus,
  PhoneCall,
  Building2,
  Users,
  FileText,
  CreditCard,
  CalendarDays,
  Camera,
  Signature,
} from 'lucide-react';
import api from '@/lib/axios';

export default function TelecallerGymsPage() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showConvertedModal, setShowConvertedModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
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
    agreement_signed: false,
  });

  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    fetchGyms();
  }, [search]);

  const fetchGyms = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;

      const response = await api.get('/telecaller/telecaller/assigned-gyms', { params });
      setGyms(response.data.assigned_gyms || []);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      setError('Failed to load assigned gyms');
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallLogClick = (gym) => {
    setSelectedGym(gym);
    setShowCallModal(true);
    // Reset form data
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
      agreement_signed: false,
    });
    setFollowUpDate('');
  };

  const handleStatusSubmit = async (status) => {
    // Validate remarks
    if (!formData.remarks.trim()) {
      setError('Remarks are required');
      return;
    }

    // If status is "No Response", proceed without additional data
    if (status === 'no_response') {
      await submitCallLog(status);
      return;
    }

    // If status is "Converted", show converted status modal
    if (status === 'converted') {
      setShowCallModal(false);
      setShowConvertedModal(true);
      return;
    }

    // For other statuses, submit directly
    await submitCallLog(status);
  };

  const submitCallLog = async (status, convertedData = null) => {
    try {
      const payload = {
        gym_id: selectedGym.id,
        status,
        call_form: {
          interest_level: formData.interest_level || null,
          total_members: formData.total_members ? parseInt(formData.total_members) : null,
          new_contact_number: formData.new_contact_number || null,
          feature_explained: formData.feature_explained,
          remarks: formData.remarks,
        },
        follow_up_date: followUpDate || null,
      };

      // Add converted status data if available
      if (convertedData) {
        payload.converted_status = convertedData;
      }

      const response = await api.post('/telecaller/telecaller/update-gym-status', payload);

      setSuccess(`Call logged successfully for ${selectedGym.name}`);
      setShowCallModal(false);
      setShowConvertedModal(false);
      setSelectedGym(null);

      // Refresh gyms to update last call status
      await fetchGyms();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to log call');
    }
  };

  const handleConvertedSubmit = async () => {
    await submitCallLog('converted', convertedStatusData);
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

  const getCallStatusBadge = (lastCallStatus) => {
    const statusConfig = {
      interested: { color: 'bg-green-900/30 text-green-400', icon: CheckCircle },
      not_interested: { color: 'bg-red-900/30 text-red-400', icon: XCircle },
      follow_up: { color: 'bg-blue-900/30 text-blue-400', icon: AlertCircle },
      no_response: { color: 'bg-gray-700 text-gray-300', icon: XCircle },
      converted: { color: 'bg-green-900/30 text-green-400', icon: CheckCircle },
    };

    const config = statusConfig[lastCallStatus] || statusConfig.no_response;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{lastCallStatus.replace('_', ' ')}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Assigned Gyms</h1>
          <p className="text-gray-400">Manage your assigned gym leads and track call progress</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search gyms by name, city, or area..."
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

        {/* Gyms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : gyms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No gyms assigned</h3>
              <p className="text-gray-500">You haven't been assigned any gyms yet</p>
            </div>
          ) : (
            gyms.map((gym) => (
              <div key={gym.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                {/* Gym Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{gym.gym_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{gym.city}</span>
                    </div>
                  </div>
                  {gym.last_call_status && getCallStatusBadge(gym.last_call_status)}
                </div>

                {/* Gym Details */}
                <div className="mb-4 space-y-2">
                  {gym.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{gym.contact_person}</span>
                    </div>
                  )}
                  {gym.contact_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{gym.contact_number}</span>
                    </div>
                  )}
                  {gym.address && (
                    <div className="text-sm text-gray-400 line-clamp-2">
                      {gym.address}
                    </div>
                  )}
                </div>

                {/* Call History */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Calls</span>
                    <span className="text-white">{gym.total_calls || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Last Call</span>
                    <span className="text-white">{formatDate(gym.last_call_date)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCallLogClick(gym)}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Log Call
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Call Form Modal */}
      {showCallModal && selectedGym && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              Log Call - {selectedGym.name}
            </h3>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Interest Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interest Level
                </label>
                <select
                  value={formData.interest_level}
                  onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Select Interest Level</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Total Members */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Members
                </label>
                <input
                  type="number"
                  value={formData.total_members}
                  onChange={(e) => setFormData({ ...formData, total_members: e.target.value })}
                  placeholder="Enter total members"
                  className="input-field w-full"
                  min="0"
                />
              </div>

              {/* New Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.new_contact_number}
                  onChange={(e) => setFormData({ ...formData, new_contact_number: e.target.value })}
                  placeholder="Enter new contact number"
                  className="input-field w-full"
                />
              </div>

              {/* Feature Explained */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature_explained"
                  checked={formData.feature_explained}
                  onChange={(e) => setFormData({ ...formData, feature_explained: e.target.checked })}
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="feature_explained" className="text-sm font-medium text-gray-300">
                  Feature Explained
                </label>
              </div>

              {/* Remarks (Mandatory) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter call details and outcome..."
                  className="input-field w-full h-32 resize-none"
                  required
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Follow-up Date (if needed)
                </label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="input-field w-full"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusSubmit('interested')}
                  className="btn-outline text-green-400 border-green-600 hover:bg-green-900/20"
                >
                  Interested
                </button>
                <button
                  onClick={() => handleStatusSubmit('not_interested')}
                  className="btn-outline text-red-400 border-red-600 hover:bg-red-900/20"
                >
                  Not Interested
                </button>
                <button
                  onClick={() => handleStatusSubmit('follow_up')}
                  className="btn-outline text-blue-400 border-blue-600 hover:bg-blue-900/20"
                >
                  Follow Up
                </button>
                <button
                  onClick={() => handleStatusSubmit('no_response')}
                  className="btn-outline text-gray-400 border-gray-600 hover:bg-gray-700/20"
                >
                  No Response
                </button>
                <button
                  onClick={() => handleStatusSubmit('converted')}
                  className="btn-outline text-green-500 border-green-500 hover:bg-green-900/20 col-span-2"
                >
                  Converted
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCallModal(false)}
                className="btn-outline text-gray-400 border-gray-600 hover:bg-gray-700/20"
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
              Conversion Details - {selectedGym.name}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="agreement_signed"
                  checked={convertedStatusData.agreement_signed}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, agreement_signed: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreement_signed" className="text-sm font-medium text-gray-300 flex items-center">
                  <Signature className="w-4 h-4 mr-2" />
                  Agreement Signed
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="document_uploaded"
                  checked={convertedStatusData.document_uploaded}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, document_uploaded: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="document_uploaded" className="text-sm font-medium text-gray-300 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Document Verified
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="membership_plan_created"
                  checked={convertedStatusData.membership_plan_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, membership_plan_created: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="membership_plan_created" className="text-sm font-medium text-gray-300 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Membership Plan Created
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="session_created"
                  checked={convertedStatusData.session_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, session_created: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="session_created" className="text-sm font-medium text-gray-300 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Session Created
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="daily_pass_created"
                  checked={convertedStatusData.daily_pass_created}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, daily_pass_created: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="daily_pass_created" className="text-sm font-medium text-gray-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Daily Pass Created
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gym_studio_images_uploaded"
                  checked={convertedStatusData.gym_studio_images_uploaded}
                  onChange={(e) => setConvertedStatusData({ ...convertedStatusData, gym_studio_images_uploaded: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="gym_studio_images_uploaded" className="text-sm font-medium text-gray-300 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Gym Studio Images Uploaded
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConvertedModal(false);
                  setShowCallModal(true);
                }}
                className="btn-outline text-gray-400 border-gray-600 hover:bg-gray-700/20"
              >
                Back
              </button>
              <button
                onClick={handleConvertedSubmit}
                className="btn-primary"
              >
                Submit Conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}