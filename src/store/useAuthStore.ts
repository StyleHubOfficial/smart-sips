import { create } from 'zustand';

export type UserRole = 'guest' | 'teacher' | 'admin' | 'developer';

interface AuthStore {
  isAuthenticated: boolean;
  role: UserRole;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: localStorage.getItem('sunrise_auth') === 'true',
  role: (localStorage.getItem('sunrise_role') as UserRole) || 'guest',
  login: (id, pass) => {
    if (id === 'sunrise' && pass === 'password') {
      localStorage.setItem('sunrise_auth', 'true');
      localStorage.setItem('sunrise_role', 'teacher');
      set({ isAuthenticated: true, role: 'teacher' });
      return true;
    }
    if (id === 'admin' && pass === 'admin123') {
      localStorage.setItem('sunrise_auth', 'true');
      localStorage.setItem('sunrise_role', 'admin');
      set({ isAuthenticated: true, role: 'admin' });
      return true;
    }
    if (id === 'dev' && pass === 'dev123') {
      localStorage.setItem('sunrise_auth', 'true');
      localStorage.setItem('sunrise_role', 'developer');
      set({ isAuthenticated: true, role: 'developer' });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('sunrise_auth');
    localStorage.removeItem('sunrise_role');
    set({ isAuthenticated: false, role: 'guest' });
  },
}));
