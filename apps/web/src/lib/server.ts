import ky from 'ky';

import { getCookies, getCsrfToken, isServer } from '@/util/server';

import { env } from './env';
import SyncError, { ErrorCode } from './error';

interface ErrorResponse {
  detail: string;
  instance: string;
  status: number;
  title: string;
  code: ErrorCode;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_TOKEN_URL = `${env.NEXT_PUBLIC_BACKEND_URL}/csrf`;

let csrfTokenRequest: Promise<void> | null = null;

async function ensureCsrfToken() {
  if (isServer() || (await getCsrfToken())) {
    return;
  }

  csrfTokenRequest ??= fetch(CSRF_TOKEN_URL, {
    credentials: 'include',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('CSRF 토큰을 발급받지 못했습니다.');
      }
    })
    .finally(() => {
      csrfTokenRequest = null;
    });

  await csrfTokenRequest;
}

export const server = ky.extend({
  prefixUrl: env.NEXT_PUBLIC_BACKEND_URL,
  credentials: 'include',
  retry: {
    limit: 1,
    methods: ['post', 'put', 'patch', 'delete'],
    statusCodes: [403],
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        if (isServer()) {
          const cookies = await getCookies();
          if (cookies) {
            request.headers.set('Cookie', cookies);
          }
        }
      },
      async (request) => {
        if (UNSAFE_METHODS.has(request.method)) {
          await ensureCsrfToken();

          const csrfToken = await getCsrfToken();
          if (csrfToken) {
            request.headers.set('X-XSRF-TOKEN', csrfToken);
          }
        }
      },
    ],
    beforeError: [
      async (error) => {
        const { response } = error;

        if (response.status === 401 || response.status === 403) {
          return error;
        }

        const body = await response.json<ErrorResponse>();
        throw new SyncError(body.detail, body.code);
      },
    ],
  },
});

const getUrl = (url: string) => {
  if (url.startsWith('/')) {
    return url.slice(1);
  }

  return url;
};

export const api = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await server(getUrl(url), options);

  if (response.status === 204) {
    return {
      status: response.status,
      data: undefined,
      headers: response.headers,
    } as T;
  }

  const contentType = response.headers.get('Content-Type');

  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    data,
    headers: response.headers,
  } as T;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_T> = SyncError;
