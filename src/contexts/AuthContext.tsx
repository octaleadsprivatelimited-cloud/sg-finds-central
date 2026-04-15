import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "superadmin" | "admin" | "business_owner" | "user";

const DEV_AUTH_KEY = "dev_auth_role";
const DEV_BYPASS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBusinessOwner: boolean;
  // Dev bypass
  devLogin: (role: UserRole) => void;
  devLogout: () => void;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: "user",
  isAdmin: false,
  isSuperAdmin: false,
  isBusinessOwner: false,
  devLogin: () => {},
  devLogout: () => {},
  isDevMode: false,
});

export const useAuth = () => useContext(AuthContext);

// Fake user object for dev bypass
const createFakeUser = (role: UserRole): Partial<User> => ({
  uid: `dev-${role}`,
  email: `${role}@dev.local`,
  displayName: role === "superadmin" ? "Super Admin" : role === "admin" ? "Admin" : role === "business_owner" ? "Business Owner" : "Test User",
  emailVerified: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("user");
  const [isDevMode, setIsDevMode] = useState(false);

  const devLogin = (devRole: UserRole) => {
    if (!DEV_BYPASS_ENABLED) return;
    localStorage.setItem(DEV_AUTH_KEY, devRole);
    setRole(devRole);
    setUser(createFakeUser(devRole) as User);
    setIsDevMode(true);
    setLoading(false);
  };

  const devLogout = () => {
    localStorage.removeItem(DEV_AUTH_KEY);
    setRole("user");
    setUser(null);
    setIsDevMode(false);
  };

  // Restore dev session on mount, but always allow real Firebase auth to take over
  useEffect(() => {
    if (!DEV_BYPASS_ENABLED) {
      try {
        localStorage.removeItem(DEV_AUTH_KEY);
      } catch {}
    }

    const getSavedDevRole = (): UserRole | null => {
      if (!DEV_BYPASS_ENABLED) return null;
      try {
        return localStorage.getItem(DEV_AUTH_KEY) as UserRole | null;
      } catch {
        return null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Block unverified email/password users (social logins are always verified)
        const isEmailProvider = firebaseUser.providerData.some(p => p.providerId === "password");
        if (isEmailProvider && !firebaseUser.emailVerified) {
          await auth.signOut();
          setRole("user");
          setUser(null);
          setIsDevMode(false);
          setLoading(false);
          return;
        }

        try {
          localStorage.removeItem(DEV_AUTH_KEY);
        } catch {}

        setIsDevMode(false);
        setUser(firebaseUser);

        try {
          const superDoc = await getDoc(doc(db, "superadmins", firebaseUser.uid));
          if (superDoc.exists()) {
            setRole("superadmin");
          } else {
            const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
            if (adminDoc.exists()) {
              setRole("admin");
            } else {
              const { getDocs, query, where, collection } = await import("firebase/firestore");
              const listingsQuery = query(collection(db, "listings"), where("ownerId", "==", firebaseUser.uid));
              const listingsSnap = await getDocs(listingsQuery);
              setRole(listingsSnap.empty ? "user" : "business_owner");
            }
          }
        } catch {
          setRole("user");
        }

        setLoading(false);
        return;
      }

      const savedRole = getSavedDevRole();
      if (savedRole) {
        setRole(savedRole);
        setUser(createFakeUser(savedRole) as User);
        setIsDevMode(true);
      } else {
        setRole("user");
        setUser(null);
        setIsDevMode(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";
  const isBusinessOwner = role === "business_owner" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isSuperAdmin, isBusinessOwner, devLogin, devLogout, isDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};
