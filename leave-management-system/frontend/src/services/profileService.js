import api from './api';

export const profileService = {
  /**
   * Get current authenticated user's profile
   * @returns {Promise<{ name: string, email: string, role: string }>}
   */
  getProfile: async () => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  /**
   * Update authenticated user's name
   * @param {{ name: string }} data
   * @returns {Promise<{ name: string, email: string, role: string }>}
   */
  updateProfile: async (data) => {
    const response = await api.put('/api/profile', data);
    return response.data;
  },
};

export default profileService;
