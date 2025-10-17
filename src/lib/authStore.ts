import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { auth, db } from "@/firebaseConfig";
import UserDAO from "./UserDAO";

const provider = new GoogleAuthProvider();

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  loginGoogleWithPopup: async () => {
    await signInWithPopup(auth, provider).catch((error) => {
      console.log(error);
    });
  },
  logout: async () => {
    await signOut(auth)
      .then(() => {
        set({ user: null });
      })
      .catch((error) => {
        console.log(error);
      });
  },
  observeAuthState: () => {
    set({ loading: true });
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await UserDAO.getUserById(user.uid);
        if (userData.success) {
          set({ user: { ...user, ...userData.data }, loading: false });
        } else {
          set({ user, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  },
}));

export { useAuthStore };
