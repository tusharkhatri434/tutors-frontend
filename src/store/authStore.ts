import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem('userInfo');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromStorage(),
  login: (user) => {
    localStorage.setItem('userInfo', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('userInfo');
    set({ user: null });
  },
}));
