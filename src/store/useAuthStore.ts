import { create } from 'zustand';

export type UserRole = 'guest' | 'teacher' | 'admin' | 'developer';

interface AuthStore {
  isAuthenticated: boolean;
  role: UserRole;
  user: any | null; // Using any for Firebase user type simplicity here
  login: (id: string, pass: string) => boolean;
  setFirebaseUser: (user: any, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: localStorage.getItem('sunrise_auth') === 'true',
  role: (localStorage.getItem('sunrise_role') as UserRole) || 'guest',
  user: null,
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
    if (id === 'developer' && pass === 'dev123') {
      localStorage.setItem('sunrise_auth', 'true');
      localStorage.setItem('sunrise_role', 'developer');
      set({ isAuthenticated: true, role: 'developer' });
      return true;
    }
    return false;
  },
  setFirebaseUser: (user, role) => {
    localStorage.setItem('sunrise_auth', 'true');
    localStorage.setItem('sunrise_role', role);
    set({ isAuthenticated: true, role: role as UserRole, user });
  },
  logout: () => {
    localStorage.removeItem('sunrise_auth');
    localStorage.removeItem('sunrise_role');
    set({ isAuthenticated: false, role: 'guest', user: null });
  },
}));
