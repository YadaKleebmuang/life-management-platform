import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Define a placeholder interface for future user settings
export interface UserSettings {
  theme?: "light" | "dark" | "system";
  currency?: string;
  notificationsEnabled?: boolean;
}

const defaultSettings: UserSettings = {
  theme: "light",
  currency: "THB",
  notificationsEnabled: true,
};

export const getSettings = async (userId: string): Promise<UserSettings> => {
  if (!userId) return defaultSettings;
  
  const docRef = doc(db, "users", userId, "settings", "preferences");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserSettings;
  } else {
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  }
};

export const saveSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "settings", "preferences");
  await setDoc(docRef, settings, { merge: true });
};
