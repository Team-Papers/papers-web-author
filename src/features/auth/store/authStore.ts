import { create } from 'zustand';
import type { User, AuthorProfile } from '@/types/models';
import { AuthorStatus } from '@/types/models';
import * as authApi from '@/lib/api/auth';
import * as authorApi from '@/lib/api/authors';
import type { LoginRequest, RegisterRequest, AuthorApplyRequest } from '@/types/api';

interface AuthState {
  user: User | null;
  authorProfile: AuthorProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthorApproved: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  applyAsAuthor: (data: AuthorApplyRequest) => Promise<void>;
  fetchAuthorProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authorProfile: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,
  isAuthorApproved: false,

  login: async (data) => {
    const res = await authApi.login(data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
    // Try to fetch author profile
    try {
      const profile = await authorApi.getMyProfile();
      set({ authorProfile: profile, isAuthorApproved: profile.status === AuthorStatus.APPROVED });
    } catch {
      set({ authorProfile: null, isAuthorApproved: false });
    }
  },

  register: async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, authorProfile: null, accessToken: null, isAuthenticated: false, isAuthorApproved: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { set({ isLoading: false, isAuthenticated: false }); return; }
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
      try {
        const profile = await authorApi.getMyProfile();
        set({ authorProfile: profile, isAuthorApproved: profile.status === AuthorStatus.APPROVED, isLoading: false });
      } catch {
        set({ authorProfile: null, isAuthorApproved: false, isLoading: false });
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  applyAsAuthor: async (data) => {
    const profile = await authorApi.applyAsAuthor(data);
    set({ authorProfile: profile, isAuthorApproved: profile.status === AuthorStatus.APPROVED });
  },

  fetchAuthorProfile: async () => {
    try {
      const profile = await authorApi.getMyProfile();
      set({ authorProfile: profile, isAuthorApproved: profile.status === AuthorStatus.APPROVED });
    } catch {
      set({ authorProfile: null, isAuthorApproved: false });
    }
  },
}));
