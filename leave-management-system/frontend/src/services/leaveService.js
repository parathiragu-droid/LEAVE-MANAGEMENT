import api from './api';

export const leaveService = {
  /**
   * Submit a new leave request
   * @param {{ leaveType: string, startDate: string, endDate: string, reason: string }} data
   * @returns {Promise<any>}
   */
  createLeave: async (data) => {
    const response = await api.post('/api/leaves', data);
    return response.data;
  },

  /**
   * Get all leave requests for the authenticated employee
   * @returns {Promise<any[]>}
   */
  getMyLeaves: async () => {
    const response = await api.get('/api/leaves/my');
    return response.data;
  },

  /**
   * Get single leave request by ID
   * @param {string} id
   * @returns {Promise<any>}
   */
  getLeaveById: async (id) => {
    const response = await api.get(`/api/leaves/${id}`);
    return response.data;
  },

  /**
   * Update an existing pending leave request
   * @param {string} id
   * @param {{ leaveType: string, startDate: string, endDate: string, reason: string }} data
   * @returns {Promise<any>}
   */
  updateLeave: async (id, data) => {
    const response = await api.put(`/api/leaves/${id}`, data);
    return response.data;
  },

  /**
   * Cancel a pending leave request
   * @param {string} id
   * @returns {Promise<any>}
   */
  cancelLeave: async (id) => {
    const response = await api.put(`/api/leaves/${id}/cancel`);
    return response.data;
  },

  /**
   * Get leave summary counts for current employee dashboard
   * @returns {Promise<{ total: number, pending: number, approved: number, rejected: number, cancelled: number }>}
   */
  getDashboardSummary: async () => {
    const response = await api.get('/api/leaves/summary');
    return response.data;
  },
};

export default leaveService;
