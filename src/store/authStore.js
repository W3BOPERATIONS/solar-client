import { create } from 'zustand';

const authStore = create((set) => ({
  user: null,
  token: sessionStorage.getItem('token') || localStorage.getItem('token'),
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    sessionStorage.setItem('token', token);
    localStorage.setItem('token', token);
    set({ token });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  logout: () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default authStore;
