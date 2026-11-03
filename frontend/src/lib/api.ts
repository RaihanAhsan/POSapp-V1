function getBaseUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (envUrl) {
    return envUrl;
  }
  // In local browser development, fallback to local Go backend port 8080 if env is unset
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/api';
  }
  // Default to relative '/api' for Vercel deployment and same-origin reverse proxy
  return '/api';
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('posv1_token') || localStorage.getItem('kasirku_token');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const baseUrl = getBaseUrl();
  let url: string;
  if (baseUrl === '/api') {
    url = normalizedEndpoint.startsWith('/api') ? normalizedEndpoint : `/api${normalizedEndpoint}`;
  } else {
    // Absolute base URL (e.g. http://localhost:8080/api)
    const cleanPath = normalizedEndpoint.startsWith('/api')
      ? normalizedEndpoint.replace(/^\/api/, '')
      : normalizedEndpoint;
    url = `${baseUrl}${cleanPath}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = responseData?.message || response.statusText || 'An error occurred';
    const errorCode = responseData?.code;
    
    // Auto logout if 401 Unauthorized
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('posv1_token');
      localStorage.removeItem('posv1_user');
      localStorage.removeItem('kasirku_token');
      localStorage.removeItem('kasirku_user');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw new ApiError(response.status, errorMsg, errorCode);
  }

  return responseData?.data as T;
}
