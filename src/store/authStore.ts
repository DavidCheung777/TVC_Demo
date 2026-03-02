import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

// Initialize state from local storage if available
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

if (storedUser && storedToken) {
  useAuthStore.getState().login(JSON.parse(storedUser), storedToken);
}
