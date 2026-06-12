import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { UserProfile } from "../types";

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("isRegistering", "true");
    }
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update display name in Firebase Auth
    await updateProfile(user, { displayName: name });

    // 3. Create user document in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(userDocRef, userData);

    // ทำการออกจากระบบทันทีหลังจากสมัครสมาชิกเสร็จ เพื่อให้ผู้ใช้ไปล็อกอินเอง
    await signOut(auth);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("isRegistering");
    }

    return user;
  } catch (error) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("isRegistering");
    }
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};
