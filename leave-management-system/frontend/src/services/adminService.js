import api from './api';

export const adminService = {
  /**
   * Get real-time admin metrics
   * @returns {Promise<{ totalEmployees: number, totalRequests: number, pending: number, approved: number, rejected: number, cancelled: number }>}
   */
  getDashboard: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },

  /**
   * Get all leave requests, optionally filtered by status
   * @param {string} [status]
   * @returns {Promise<any[]>}
   */
  getAllLeaves: async (status) => {
    const params = status && status !== 'ALL' ? { status } : {};
    const response = await api.get('/api/admin/leaves', { params });
    return response.data;
  },

  /**
   * Get single leave request by ID
   * @param {string} id
   * @returns {Promise<any>}
   */
  getLeaveById: async (id) => {
    const response = await api.get(`/api/admin/leaves/${id}`);
    return response.data;
  },

  /**
   * Approve a pending leave request
   * @param {string} id
   * @param {string} [comment]
   * @returns {Promise<any>}
   */
  approveLeave: async (id, comment = 'Approved.') => {
    const response = await api.put(`/api/admin/leaves/${id}/approve`, { comment });
    return response.data;
  },

  /**
   * Reject a pending leave request (comment is mandatory)
   * @param {string} id
   * @param {string} comment
   * @returns {Promise<any>}
   */
  rejectLeave: async (id, comment) => {
    const response = await api.put(`/api/admin/leaves/${id}/reject`, { comment });
    return response.data;
  },

  /**
   * Get list of employees with their leave counts (excluding admin accounts)
   * @returns {Promise<any[]>}
   */
  getEmployees: async () => {
    const response = await api.get('/api/admin/employees');
    return response.data;
  },

  /**
   * Get leave history for a specific employee
   * @param {string} employeeId
   * @returns {Promise<any[]>}
   */
  getEmployeeLeaves: async (employeeId) => {
    const response = await api.get(`/api/admin/employees/${employeeId}/leaves`);
    return response.data;
  },
};

export default adminService;
