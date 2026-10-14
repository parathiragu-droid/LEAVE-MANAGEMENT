export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  APPLY_LEAVE: '/apply-leave',
  MY_REQUESTS: '/my-requests',
  MY_REQUESTS_EDIT: '/my-requests/:id/edit',
  MY_REQUESTS_DETAIL: '/my-requests/:id',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_REQUESTS_DETAIL: '/admin/requests/:id',
  ADMIN_EMPLOYEES: '/admin/employees',
  PROFILE: '/profile',
};

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
};

export const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'EARNED', label: 'Earned Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'OTHER', label: 'Other' },
];

export const LEAVE_TYPE_LABELS = {
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  EARNED: 'Earned Leave',
  EMERGENCY: 'Emergency Leave',
  OTHER: 'Other',
};

export const LEAVE_STATUSES = {
  ALL: 'ALL',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

export const API_ENDPOINTS = {
  HEALTH: '/api/health',
};
