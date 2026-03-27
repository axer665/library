const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  window.location.href = '/login';
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const p = (async () => {
    const token = getToken();
    if (!token) return null;

    const res = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      clearToken();
      return null;
    }

    const data = await res.json().catch(() => ({}));
    const newToken = data?.access_token;
    if (typeof newToken !== 'string' || !newToken) {
      clearToken();
      return null;
    }

    setToken(newToken);
    return newToken;
  })();

  refreshPromise = p;
  try {
    return await p;
  } finally {
    refreshPromise = null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { noAuth?: boolean; _retried?: boolean } = {}
): Promise<T> {
  const { noAuth, _retried, ...fetchOptions } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  const token = getToken();
  if (token && !noAuth) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401) {
    const canTryRefresh = !noAuth && !_retried && path !== '/refresh';
    if (canTryRefresh) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, {
          ...options,
          _retried: true,
          headers: {
            ...(fetchOptions.headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }
    clearToken();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.errors ? JSON.stringify(data.errors) : 'Request failed');
  }

  return data as T;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<{ user: { id: number; name: string; email: string }; access_token: string }>('/register', {
        method: 'POST',
        body: JSON.stringify(data),
        noAuth: true,
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: { id: number; name: string; email: string }; access_token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify(data),
        noAuth: true,
      }),
    refresh: () =>
      request<{ access_token: string; token_type: string; expires_in: number }>('/refresh', {
        method: 'POST',
      }),
    logout: () => request('/logout', { method: 'POST' }),
    me: () => request<{ id: number; name: string; email: string }>('/me'),
  },
  locations: {
    list: () => request<Array<{
      id: number;
      name: string;
      archives_count?: number;
      archives?: Array<{
        id: number;
        name: string;
        books?: Array<{ id: number; title: string; photo_path?: string }>;
      }>;
    }>>('/locations'),
    create: (name: string) => request<{ id: number; name: string }>('/locations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    get: (id: number) => request<{ id: number; name: string; archives: unknown[] }>(`/locations/${id}`),
    update: (id: number, name: string) => request<{ id: number; name: string }>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
    delete: (id: number) => request(`/locations/${id}`, { method: 'DELETE' }),
  },
  archives: {
    list: (locationId: number) =>
      request<Array<{ id: number; name: string; books_count?: number }>>(`/locations/${locationId}/archives`),
    create: (locationId: number, name: string) =>
      request<{ id: number; name: string }>(`/locations/${locationId}/archives`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    update: (id: number, data: { name?: string; location_id?: number }) =>
      request<{ id: number; name: string }>(`/archives/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request(`/archives/${id}`, { method: 'DELETE' }),
  },
  books: {
    list: (archiveId: number) =>
      request<Array<{
        id: number;
        author: string;
        title: string;
        publisher: string;
        annotation?: string;
        year?: number;
        photo_path?: string;
      }>>(`/archives/${archiveId}/books`),
    create: (archiveId: number, data: {
      author: string;
      title: string;
      publisher: string;
      annotation?: string;
      year?: number;
    }) =>
      request<{ id: number; author: string; title: string; publisher: string }>(
        `/archives/${archiveId}/books`,
        { method: 'POST', body: JSON.stringify(data) }
      ),
    update: (id: number, data: Record<string, unknown>) =>
      request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/books/${id}`, { method: 'DELETE' }),
    uploadPhoto: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const upload = async (retried = false): Promise<unknown> => {
        const res = await fetch(`${API_URL}/books/${id}/photo`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        });

        if (res.status === 401 && !retried) {
          const newToken = await refreshAccessToken();
          if (newToken) return upload(true);
          clearToken();
          redirectToLogin();
          throw new Error('Unauthorized');
        }

        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      };

      return upload();
    },
  },
  search: {
    books: (params: Record<string, string | number | undefined>) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
      return request<{
        data: Array<{
          id: number;
          author: string;
          title: string;
          publisher: string;
          annotation?: string;
          year?: number;
          photo_path?: string;
          archive?: { location?: { name: string }; name?: string };
        }>;
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>(`/books/search?${qs}`);
    },
  },
};

/** Alias for backward compatibility */
export const authApi = {
  login: (email: string, password: string) => api.auth.login({ email, password }),
  register: (name: string, email: string, password: string, passwordConfirmation: string) =>
    api.auth.register({ name, email, password, password_confirmation: passwordConfirmation }),
};
