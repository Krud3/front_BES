import {
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
import { db } from "@/firebaseConfig";

class UserDAO {
  private collectionRef: any;

  constructor() {
    this.collectionRef = collection(db, "users");
  }

  async getUserById(id: string) {
    try {
      const userDoc = await getDoc(doc(this.collectionRef, id));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, data: null };
      }
    } catch (error) {
      console.log("Error getting document:", error);
      return { success: false, data: null };
    }
  }

  async getUserByEmail(email: string) {
    const peticion = query(this.collectionRef, where("email", "==", email));
    const querySnapshot = await getDocs(peticion);
    if (!querySnapshot.empty) {
      return { success: true, data: querySnapshot.docs[0].data() };
    } else {
      return { success: false, data: null };
    }
  }

  async createUser(userData: any) {
    const userCheck = await this.getUserByEmail(userData.email);

    if (userCheck.success) {
      console.log("User already exists.");
      return;
    }

    const userDocRef = doc(this.collectionRef, userData.uid);
    await setDoc(
      userDocRef,
      {
        email: userData.email,
        name: userData.name,
        photo: userData.photo,
        roles: userData.roles || ["Guest"], // Initialize roles field
        usageLimits: userData.usageLimits || {}, // Initialize usage limits field
      },
      { merge: true },
    )
      .then(() => {
        console.log("Document written with ID:", userData.uid);
      })
      .catch((error) => {
        console.log("Error adding document:", error);
      });
  }

  async updateUser(id: string, userData: any) {
    const userRef = doc(this.collectionRef, id);
    await updateDoc(userRef, userData)
      .then(() => console.log("Document successfully updated"))
      .catch((error) => {
        console.log("Error updating document:", error);
      });
  }

  async deleteUser(id: string) {
    await deleteDoc(doc(this.collectionRef, id))
      .then(() => console.log("Document successfully deleted"))
      .catch((error) => {
        console.log("Error removing document:", error);
      });
  }
}

export default new UserDAO();
