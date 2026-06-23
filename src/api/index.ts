/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from "@/store/auth-store";
import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const { user, session } = useAuthStore.getState();
  if (user?.id) config.headers["x-user-id"] = user.id;
  if (session?.activeOrganizationId)
    config.headers["x-organization-id"] = session.activeOrganizationId;
  return config;
});

// 1. Tab Synchronization via BroadcastChannel
const authChannel = new BroadcastChannel("auth_session_sync");

// Listen for logout or session expiry signals from other tabs
authChannel.onmessage = (event) => {
  if (event.data.type === "AUTH_EXPIRED") {
    processQueue(new Error("Session expired"));
    // Force redirect or clear local auth state because another tab failed to refresh
    window.location.href = "/login";
  } else if (event.data.type === "SESSION_REFRESHED") {
    // Another tab successfully renewed the cookie!
    // We can safely process any requests that were waiting in this tab
    processQueue(null);
  }
};

// 2. Traffic Control (Queue Management)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
  isRefreshing = false;
};

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;

  const excludedPaths = [
    // "/auth/get-session",
    "/organization/needs-setup",
    "/auth/refresh-session",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/contractors/sign-up",
    "/auth/sign-out",
    "/auth/send-verification-otp",
    "/auth/two-factor/verify-totp",
  ];

  return excludedPaths.some((path) => url.includes(path));
};

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Catch 401 Unauthorized
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      // SCENARIO A: A refresh is ALREADY happening (solves Higher Traffic problem)
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // SCENARIO B: We are the first request to fail. Start the refresh.
      isRefreshing = true;

      try {
        // Call your custom backend getSession wrapper
        const refreshUrl = `${
          import.meta.env.VITE_API_URL
        }/auth/refresh-session`;
        await axios.post(refreshUrl, {}, { withCredentials: true });

        // Tell other tabs: "Hey, I just fixed the session cookie!"
        authChannel.postMessage({ type: "SESSION_REFRESHED" });

        // Process our own queue and retry the original request
        processQueue(null);
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed (session is completely dead)
        processQueue(refreshError);

        // Tell other tabs to boot the user to login immediately
        authChannel.postMessage({ type: "AUTH_EXPIRED" });

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
