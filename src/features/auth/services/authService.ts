import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { UserProfile } from "../types";
import { getAuthErrorMessage } from "../utils/errorMessages";

type NormalizedAuthError = Error & {
  code?: string;
};

function normalizeAuthError(error: unknown): NormalizedAuthError {
  const normalizedError = new Error(getAuthErrorMessage(error)) as NormalizedAuthError;

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      normalizedError.code = code;
    }
  }

  return normalizedError;
}

export const registerWithEmail = async (email: string, password: string, name: string) => {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser) {
    sessionStorage.setItem("isRegistering", "true");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    const userDocRef = doc(db, "users", user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, userData);

    await signOut(auth);

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw normalizeAuthError(error);
  } finally {
    if (isBrowser) {
      sessionStorage.removeItem("isRegistering");
    }
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw normalizeAuthError(error);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw normalizeAuthError(error);
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
