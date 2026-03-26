import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "superadmin" | "admin" | "business_owner" | "user";

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
  const [isDevMode, setIsDevMode] = useState(() => {
    try { return localStorage.getItem("dev_auth_role") !== null; } catch { return false; }
  });

  const devLogin = (devRole: UserRole) => {
    localStorage.setItem("dev_auth_role", devRole);
    setRole(devRole);
    setUser(createFakeUser(devRole) as User);
    setIsDevMode(true);
    setLoading(false);
  };

  const devLogout = () => {
    localStorage.removeItem("dev_auth_role");
    setRole("user");
    setUser(null);
    setIsDevMode(false);
  };

  // Restore dev session on mount, but always allow real Firebase auth to take over
  useEffect(() => {
    const getSavedDevRole = (): UserRole | null => {
      try {
        return localStorage.getItem("dev_auth_role") as UserRole | null;
      } catch {
        return null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          localStorage.removeItem("dev_auth_role");
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
