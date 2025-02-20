import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { GoogleAuthProvider } from 'firebase/auth';
import { create } from 'zustand';
import { doc, setDoc } from 'firebase/firestore';
import UserDAO from './UserDAO';

const provider = new GoogleAuthProvider();

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
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
    updateUserPoints: async (uid, points) => {
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, { points }, { merge: true });
            console.log('User points updated successfully');
        } catch (error) {
            console.error('Error updating user points:', error);
        }
    },
    updateUserPerfectScoreValue: async (uid, perfectScore) => {
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, { perfectScore }, { merge: true });
            console.log('User perfectScore value updated successfully');
        } catch (error) {
            console.error('Error updating user perfectScore:', error);
        }
    },
    updateUserTreesSavedValue: async (uid, treesSaved) => {
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, { treesSaved }, { merge: true });
            console.log('User treesSaved value updated successfully');
        } catch (error) {
            console.error('Error updating user treesSaved:', error);
        }
    },
}));

export { useAuthStore };