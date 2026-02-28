import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: localStorage.getItem('sunrise_auth') === 'true',
  login: (id, pass) => {
    if (id === 'sunrise' && pass === 'password') {
      localStorage.setItem('sunrise_auth', 'true');
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('sunrise_auth');
    set({ isAuthenticated: false });
  },
}));
