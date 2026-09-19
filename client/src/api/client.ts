let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions extends RequestInit {
  retry?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Include credentials for HttpOnly refresh cookie
  options.credentials = 'include';
  options.headers = headers;

  const response = await fetch(endpoint, options);

  // If 401 and not already retried, attempt refresh token flow
  if (response.status === 401 && !options.retry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          // Retry original request with new token
          options.retry = true;
          return apiFetch<T>(endpoint, options);
        }
      }
    } catch (e) {
      console.warn('Auto refresh failed:', e);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || response.statusText || 'An API error occurred';
    throw new Error(message);
  }

  return data.data !== undefined ? data.data : data;
}

// API helper collection
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  refresh: () =>
    apiFetch<{ accessToken: string; user: any }>('/api/auth/refresh', {
      method: 'POST',
    }),

  logout: () =>
    apiFetch<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () => apiFetch<any>('/api/auth/me'),

  // Dashboard
  getDashboardMetrics: () => apiFetch<any>('/api/dashboard/metrics'),

  // Projects
  getProjects: () => apiFetch<any[]>('/api/projects'),
  getProjectById: (id: string) => apiFetch<any>(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string; clientId: string }) =>
    apiFetch<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    apiFetch<any>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    apiFetch<any>(`/api/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (queryString = '') =>
    apiFetch<any[]>(`/api/tasks${queryString ? `?${queryString}` : ''}`),
  getTaskById: (id: number) => apiFetch<any>(`/api/tasks/${id}`),
  createTask: (data: any) =>
    apiFetch<any>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id: number, status: string) =>
    apiFetch<any>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateTask: (id: number, data: any) =>
    apiFetch<any>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: number) =>
    apiFetch<any>(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Activity Feed (Missed event catchup)
  getActivity: (projectId?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('limit', limit.toString());
    return apiFetch<any[]>(`/api/activity?${params.toString()}`);
  },

  // Notifications
  getNotifications: () =>
    apiFetch<{ notifications: any[]; unreadCount: number }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    apiFetch<any>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiFetch<any>('/api/notifications/mark-all-read', { method: 'POST' }),

  // Users & Clients
  getDevelopers: () => apiFetch<any[]>('/api/users/developers'),
  getClients: () => apiFetch<any[]>('/api/users/clients'),
};

