import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Unsubscribe,
} from "firebase/auth";
import { create } from "zustand";
import { auth } from "@/shared/api/firebase";
import { userApi } from "../api/user.api";
import type { User } from "../types/user.types";

const provider = new GoogleAuthProvider();

interface AuthState {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  observeAuthState: () => Unsubscribe;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  observeAuthState: () => {
    set({ loading: true });

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loading: false });
        return;
      }

      const existing = await userApi.getById(firebaseUser.uid);

      if (existing) {
        set({ user: existing, loading: false });
        return;
      }

      // First loggin set user to Guest
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        name: firebaseUser.displayName ?? "",
        photo: firebaseUser.photoURL ?? "",
        roles: ["Guest"],
      };

      await userApi.create(newUser);
      set({ user: newUser, loading: false });
    });
  },
}));
