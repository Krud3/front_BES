import {
  type CollectionReference,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/shared/api/firebase";
import { logger } from "@/shared/lib/logger";
import type { User } from "../types/user.types";

const COLLECTION_NAME = "users";

function getUsersCollection(): CollectionReference {
  return collection(db, COLLECTION_NAME);
}

function getUserDocRef(uid: string) {
  return doc(getUsersCollection(), uid);
}

export const userApi = {
  async getById(uid: string): Promise<User | null> {
    try {
      const snap = await getDoc(getUserDocRef(uid));
      return snap.exists() ? (snap.data() as User) : null;
    } catch (error) {
      logger.error("userApi.getById", error);
      toast.error("Error getting user");
      return null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const q = query(getUsersCollection(), where("email", "==", email));
      const snap = await getDocs(q);
      return snap.empty || !snap.docs[0] ? null : (snap.docs[0].data() as User);
    } catch (error) {
      logger.error("userApi.getByEmail", error);
      toast.error("Error getting user by email");
      return null;
    }
  },

  async create(user: User): Promise<boolean> {
    try {
      const existing = await userApi.getByEmail(user.email);
      if (existing) return false;

      await setDoc(getUserDocRef(user.uid), {
        email: user.email,
        name: user.name,
        photo: user.photo,
        roles: user.roles,
        usageLimits: user.usageLimits ?? {},
      });
      return true;
    } catch (error) {
      logger.error("userApi.create", error);
      toast.error("Error creating user");
      return false;
    }
  },

  async update(uid: string, data: Partial<Omit<User, "uid">>): Promise<boolean> {
    try {
      await updateDoc(getUserDocRef(uid), data);
      return true;
    } catch (error) {
      logger.error("userApi.update", error);
      toast.error("Error updating user");
      return false;
    }
  },

  async remove(uid: string): Promise<boolean> {
    try {
      await deleteDoc(getUserDocRef(uid));
      return true;
    } catch (error) {
      logger.error("userApi.remove", error);
      toast.error("Error deleting user");
      return false;
    }
  },
};
