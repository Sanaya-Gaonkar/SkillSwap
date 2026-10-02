const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('skillswap_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || 'Something went wrong. Please try again.';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),

  // Users & Profile
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users?${query}`);
  },
  getUserFilterOptions: () => request('/users/filters'),
  getUserById: (id) => request(`/users/${id}`),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getProfile: (userId) => request(`/profile/${userId}`),
  updateProfile: (userId, body) => request(`/profile/${userId}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Catalog Skills
  getSkills: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/skills?${query}`);
  },
  createSkill: (body) => request('/skills', { method: 'POST', body: JSON.stringify(body) }),
  updateSkill: (id, body) => request(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSkill: (id) => request(`/skills/${id}`, { method: 'DELETE' }),

  // User Skills
  getUserSkills: (userId) => request(`/users/${userId}/skills`),
  addUserSkill: (userId, body) => request(`/users/${userId}/skills`, { method: 'POST', body: JSON.stringify(body) }),
  removeUserSkill: (userId, skillId, type) =>
    request(`/users/${userId}/skills/${skillId}${type ? `?type=${type}` : ''}`, { method: 'DELETE' }),
  batchSaveUserSkills: (userId, body) => request(`/users/${userId}/skills/batch`, { method: 'PUT', body: JSON.stringify(body) }),
  addCustomUserSkill: (userId, body) => request(`/users/${userId}/skills/custom`, { method: 'POST', body: JSON.stringify(body) }),

  // Matches
  getMatches: () => request('/matches'),

  // Connections
  getConnections: () => request('/connections'),
  sendConnectionRequest: (receiverId) =>
    request('/connections', { method: 'POST', body: JSON.stringify({ receiverId }) }),
  updateConnectionStatus: (connectionId, status) =>
    request(`/connections/${connectionId}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Messages / Chat
  getConversations: () => request('/messages/conversations/recent'),
  getMessages: (userId) => request(`/messages/${userId}`),
  sendMessage: (receiverId, content) =>
    request('/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) }),

  // Skill Exchanges
  getExchanges: () => request('/exchanges'),
  getExchangeById: (id) => request(`/exchanges/${id}`),
  proposeExchange: (body) => request('/exchanges', { method: 'POST', body: JSON.stringify(body) }),
  updateExchangeStatus: (id, status) =>
    request(`/exchanges/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Sessions
  getSessions: () => request('/sessions'),
  scheduleSession: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSession: (id, body) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Reviews
  getUserReviews: (userId) => request(`/reviews/user/${userId}`),
  addReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Learning History
  getLearningHistory: () => request('/learning-history'),

  // Learning goals, roadmaps, and activity
  getLearningSummary: () => {
    const timezoneOffset = -new Date().getTimezoneOffset();
    return request(`/learning/summary?timezoneOffset=${timezoneOffset}`);
  },
  getLearningGoals: () => request('/learning/goals'),
  createLearningGoal: (body) => request('/learning/goals', { method: 'POST', body: JSON.stringify(body) }),
  deleteLearningGoal: (id) => request(`/learning/goals/${id}`, { method: 'DELETE' }),
  completeLearningGoal: (id) => request(`/learning/goals/${id}/complete`, { method: 'POST' }),
  getLearningRoadmaps: () => request('/learning/roadmaps'),
  createLearningRoadmap: (skillName) => request('/learning/roadmaps', { method: 'POST', body: JSON.stringify({ skillName }) }),
  updateRoadmapStep: (roadmapId, stepId, status) =>
    request(`/learning/roadmaps/${roadmapId}/steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteLearningRoadmap: (id) => request(`/learning/roadmaps/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Reports
  submitReport: (body) => request('/reports', { method: 'POST', body: JSON.stringify(body) }),
  getReports: () => request('/reports'),
  resolveReport: (id, status) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users?${query}`);
  },
  updateUserStatus: (userId, status) =>
    request(`/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminSkills: () => request('/admin/skills')
};
