import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  senderRole: string;
  timestamp: any;
  isActive: boolean;
}

export function useFirebaseNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuthStore();

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort by timestamp desc
      notifs.sort((a, b) => {
        const tA = a.timestamp?.toMillis?.() || 0;
        const tB = b.timestamp?.toMillis?.() || 0;
        return tB - tA;
      });

      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = async (title: string, message: string) => {
    if (role !== 'admin' && role !== 'developer') {
      throw new Error('Unauthorized');
    }

    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      senderRole: role,
      timestamp: serverTimestamp(),
      isActive: true
    });
  };

  const deleteNotification = async (id: string) => {
    if (role !== 'admin' && role !== 'developer') {
      throw new Error('Unauthorized');
    }
    await deleteDoc(doc(db, 'notifications', id));
  };

  return { notifications, loading, addNotification, deleteNotification };
}
