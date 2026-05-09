import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const { setFirebaseUser, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setFirebaseUser(user, userSnap.data().role || 'guest');
          } else {
            // Document might be getting created by Google Sign In right now
            setFirebaseUser(user, 'guest');
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setFirebaseUser(user, 'guest');
        }
      } else {
        // Only trigger logout if we had a firebase session, to keep local fallback alive if needed
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, logout]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-[10000]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin" />
          <h2 className="text-xl font-display text-white">Loading Smart Sunrise...</h2>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
