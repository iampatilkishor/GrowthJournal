'use client';

/**
 * Supabase-authenticated fetch wrapper.
 * AuthGate calls setSessionToken() when the session changes,
 * so authFetch always has a valid token regardless of timing.
 */

let _token = null;

export function setSessionToken(token) {
  _token = token || null;
}

export async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  return fetch(url, { ...options, headers });
}
