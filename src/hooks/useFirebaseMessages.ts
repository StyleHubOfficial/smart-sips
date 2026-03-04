import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage } from '../store/useAppStore';

export function useFirebaseMessages(role: string, selectedReceiver: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter messages based on role/receiver
        if (
          (data.senderRole === role && data.receiverRole === selectedReceiver) ||
          (data.senderRole === selectedReceiver && data.receiverRole === role)
        ) {
          msgs.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
          } as ChatMessage);
        }
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [role, selectedReceiver]);

  const sendMessage = async (text: string) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, 'messages'), {
      senderRole: role,
      receiverRole: selectedReceiver,
      text,
      timestamp: serverTimestamp(),
      status: 'sent'
    });
  };

  return { messages, sendMessage };
}
