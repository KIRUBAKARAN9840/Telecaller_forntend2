export const API_ENDPOINTS = {
  // Auth endpoints
  MANAGER_SEND_OTP: '/telecaller/manager/send-otp',
  MANAGER_VERIFY_OTP: '/telecaller/manager/verify-otp',
  MANAGER_LOGOUT: '/telecaller/manager/logout',
  TELECALLER_SEND_OTP: '/telecaller/telecaller/send-otp',
  TELECALLER_VERIFY_OTP: '/telecaller/telecaller/verify-otp',
  TELECALLER_LOGOUT: '/telecaller/telecaller/logout',

  // Manager Dashboard
  MANAGER_DASHBOARD_STATS: '/telecaller/manager/dashboard/stats',
  MANAGER_TELECALLERS_LIST: '/telecaller/manager/telecallers/list',
  MANAGER_TELECALLER_ADD: '/telecaller/manager/telecallers/add',
  MANAGER_TELECALLER_UPDATE_STATUS: '/telecaller/manager/telecallers/:id/status',

  // Gym Assignment
  MANAGER_GYMS_AVAILABLE: '/telecaller/manager/gyms/available',
  MANAGER_GYMS_ASSIGNMENT_STATUS: '/telecaller/manager/gyms/assignment-status',
  MANAGER_GYMS_BULK_ASSIGN: '/telecaller/manager/gyms/bulk-assign',
  MANAGER_GYM_DETAILS: '/telecaller/manager/gyms/:id/details',

  
  // Call Monitoring
  MANAGER_CALLS_ALL: '/telecaller/manager/calls/all',
  MANAGER_FOLLOWUPS_ALL: '/telecaller/manager/followups/all',

  // Telecaller Dashboard
  TELECALLER_DASHBOARD_STATS: '/telecaller/telecaller/dashboard/stats',
  TELECALLER_GYMS_ASSIGNED: '/telecaller/telecaller/gyms/assigned',
  TELECALLER_GYM_DETAILS: '/telecaller/telecaller/gyms/:id/details',
  TELECALLER_GYMS_SEARCH: '/telecaller/telecaller/gyms/search',

  // Call Management
  TELECALLER_CALLS_HISTORY: '/telecaller/telecaller/calls/history',
  TELECALLER_CALL_LOG: '/telecaller/telecaller/calls/log',
  TELECALLER_CALL_UPDATE: '/telecaller/telecaller/calls/:id/update',
  TELECALLER_CALLS_BULK_UPDATE: '/telecaller/telecaller/calls/bulk-update',

  // Follow-up Management
  TELECALLER_FOLLOWUPS: '/telecaller/telecaller/followups',
  TELECALLER_FOLLOWUP_SCHEDULE: '/telecaller/telecaller/followups/schedule',
  TELECALLER_FOLLOWUP_COMPLETE: '/telecaller/telecaller/followups/:id/complete',
};

export const CALL_STATUSES = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  FOLLOW_UP_REQUIRED: 'follow_up_required',
  CLOSED: 'closed',
  CONVERTED: 'converted',
  NO_RESPONSE: 'no_response',
  REJECTED: 'rejected',
};

export const USER_ROLES = {
  MANAGER: 'manager',
  TELECALLER: 'telecaller',
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
};