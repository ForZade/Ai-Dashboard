import { create } from "zustand";

interface User {
  id: string;
  email: string;
  username?: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => {
    const newUser: User = {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
    }

    set({ user: newUser })
  },
  clearUser: () => set({ user: null }),
}));
