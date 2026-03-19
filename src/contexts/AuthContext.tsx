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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: "user",
  isAdmin: false,
  isSuperAdmin: false,
  isBusinessOwner: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("user");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Check superadmin first
          const superDoc = await getDoc(doc(db, "superadmins", firebaseUser.uid));
          if (superDoc.exists()) {
            setRole("superadmin");
          } else {
            const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
            if (adminDoc.exists()) {
              setRole("admin");
            } else {
              // Check if they actually own any listings
              const { getDocs, query, where, collection } = await import("firebase/firestore");
              const listingsQuery = query(collection(db, "listings"), where("ownerId", "==", firebaseUser.uid));
              const listingsSnap = await getDocs(listingsQuery);
              setRole(listingsSnap.empty ? "user" : "business_owner");
            }
          }
        } catch {
          setRole("user");
        }
      } else {
        setRole("user");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";
  const isBusinessOwner = role === "business_owner" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isSuperAdmin, isBusinessOwner }}>
      {children}
    </AuthContext.Provider>
  );
};
