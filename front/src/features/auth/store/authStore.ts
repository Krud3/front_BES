import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { GoogleAuthProvider } from 'firebase/auth';
import { create } from 'zustand';
import UserDAO from '@/features/auth/services/UserDAO';

const provider = new GoogleAuthProvider();

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user: any) => set({ user }),
    setLoading: (loading: boolean) => set({ loading }),
    loginGoogleWithPopup: async () => {
        await signInWithPopup(auth, provider)
        .catch((error) => {
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