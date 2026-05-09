import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    let role = 'guest';
    
    if (!userSnap.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'guest',
        createdAt: Date.now()
      });
    } else {
      role = userSnap.data().role || 'guest';
    }
    
    useAuthStore.getState().setFirebaseUser(user, role);
    return user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    useAuthStore.getState().logout();
  } catch (error) {
    console.error('Error signing out', error);
  }
};
