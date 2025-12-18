// API client for telecaller application
import api from './axios';

// Manager endpoints
export const managerAPI = {
  // Get telecallers
  getTelecallers: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/manager/dashboard/telecallers/list', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telecallers:', error);
      throw error;
    }
  },

  // Get available gyms for assignment
  getAvailableGyms: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/manager/gyms/available', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available gyms:', error);
      throw error;
    }
  },

  // Get assignment status
  getAssignmentStatus: async () => {
    try {
      const response = await api.get('/telecaller/manager/gyms/assignment-status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch assignment status:', error);
      throw error;
    }
  },

  // Assign gyms to telecaller
  assignGyms: async (data) => {
    try {
      const response = await api.post('/telecaller/manager/assignments/assign-gym', data);
      return response.data;
    } catch (error) {
      console.error('Failed to assign gyms:', error);
      throw error;
    }
  },

  // Unassign gym
  unassignGym: async (data) => {
    try {
      const response = await api.post('/telecaller/manager/assignments/unassign-gym', data);
      return response.data;
    } catch (error) {
      console.error('Failed to unassign gym:', error);
      throw error;
    }
  },

  // Reassign gym
  reassignGym: async (data) => {
    try {
      const response = await api.post('/telecaller/manager/assignments/reassign-gym', data);
      return response.data;
    } catch (error) {
      console.error('Failed to reassign gym:', error);
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/telecaller/manager/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  // Get performance overview
  getPerformanceOverview: async () => {
    try {
      const response = await api.get('/telecaller/manager/performance/overview');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance overview:', error);
      throw error;
    }
  },

  // Get telecaller performance stats
  getTelecallerStats: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/manager/performance/telecaller-stats', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telecaller stats:', error);
      throw error;
    }
  },

  // Get call history
  getCallHistory: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/manager/performance/call-history', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      throw error;
    }
  }
};

// Telecaller endpoints
export const telecallerAPI = {
  // Get assigned gyms
  getAssignedGyms: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/telecaller/assigned-gyms', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch assigned gyms:', error);
      throw error;
    }
  },

  // Get gym details
  getGymDetails: async (gymId) => {
    try {
      const response = await api.get(`/telecaller/telecaller/gym-details/${gymId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gym details:', error);
      throw error;
    }
  },

  // Log quick call
  logQuickCall: async (gymId, data) => {
    try {
      const response = await api.post(`/telecaller/telecaller/gyms/${gymId}/call`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to log call:', error);
      throw error;
    }
  },

  // Get call history
  getCallHistory: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/telecaller/call-history', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/telecaller/telecaller/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  // Get follow-ups
  getFollowUps: async (params = {}) => {
    try {
      const response = await api.get('/telecaller/follow-ups', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
      throw error;
    }
  },

  // Get today's follow-ups
  getTodaysFollowUps: async () => {
    try {
      const response = await api.get('/telecaller/follow-ups/today');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today\'s follow-ups:', error);
      throw error;
    }
  },

  // Complete follow-up
  completeFollowUp: async (followUpId) => {
    try {
      const response = await api.post(`/telecaller/follow-ups/${followUpId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Failed to complete follow-up:', error);
      throw error;
    }
  },

  // Reschedule follow-up
  rescheduleFollowUp: async (followUpId, newDate) => {
    try {
      const response = await api.put(`/telecaller/follow-ups/${followUpId}/reschedule?new_date=${newDate}`);
      return response.data;
    } catch (error) {
      console.error('Failed to reschedule follow-up:', error);
      throw error;
    }
  }
};

// Authentication endpoints
export const authAPI = {
  // Manager send OTP
  managerSendOTP: async (mobileNumber) => {
    try {
      const response = await api.post('/telecaller/manager/send-otp', { mobile_number: mobileNumber });
      return response.data;
    } catch (error) {
      console.error('Failed to send manager OTP:', error);
      throw error;
    }
  },

  // Manager verify OTP
  managerVerifyOTP: async (mobileNumber, otp) => {
    try {
      const response = await api.post('/telecaller/manager/verify-otp', {
        mobile_number: mobileNumber,
        otp: otp
      });
      return response.data;
    } catch (error) {
      console.error('Failed to verify manager OTP:', error);
      throw error;
    }
  },

  // Telecaller send OTP
  telecallerSendOTP: async (mobileNumber) => {
    try {
      const response = await api.post('/telecaller/telecaller/send-otp', { mobile_number: mobileNumber });
      return response.data;
    } catch (error) {
      console.error('Failed to send telecaller OTP:', error);
      throw error;
    }
  },

  // Telecaller verify OTP
  telecallerVerifyOTP: async (mobileNumber, otp) => {
    try {
      const response = await api.post('/telecaller/telecaller/verify-otp', {
        mobile_number: mobileNumber,
        otp: otp
      });
      return response.data;
    } catch (error) {
      console.error('Failed to verify telecaller OTP:', error);
      throw error;
    }
  }
};

export default {
  managerAPI,
  telecallerAPI,
  authAPI
};