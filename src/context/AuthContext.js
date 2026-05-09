// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'user' | 'doctor' | null
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        // Check admin first
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (adminSnap.exists()) {
          setRole('admin');
          setUserProfile({ id: firebaseUser.uid, ...adminSnap.data(), role: 'admin' });
          setLoading(false);
          return;
        }

        // Check student
        const studentSnap = await getDoc(doc(db, 'students', firebaseUser.uid));
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          setRole('user');
          setUserProfile({ id: firebaseUser.uid, ...data, role: 'user' });
          setLoading(false);
          return;
        }

        // Check doctor
        const doctorSnap = await getDoc(doc(db, 'doctors', firebaseUser.uid));
        if (doctorSnap.exists()) {
          const data = doctorSnap.data();
          setRole('doctor');
          setUserProfile({ id: firebaseUser.uid, ...data, role: 'doctor' });
          setLoading(false);
          return;
        }

        // User exists in Auth but not in any collection — sign them out
        await signOut(auth);
        setUser(null);
        setRole(null);
        setUserProfile(null);
      } catch (err) {
        console.error('Auth context error:', err);
        setUser(null);
        setRole(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const collection = role === 'doctor' ? 'doctors' : 'students';
      const snap = await getDoc(doc(db, collection, user.uid));
      if (snap.exists()) {
        setUserProfile({ id: user.uid, ...snap.data(), role });
      }
    } catch (e) {
      console.error('Refresh profile error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, role, userProfile, loading, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
