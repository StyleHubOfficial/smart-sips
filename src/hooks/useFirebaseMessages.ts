import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage } from '../store/useAppStore';

export function useFirebaseMessages(role: string, selectedReceiver: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    let q;
    if (role === 'admin' || role === 'developer') {
      // Admins/Devs can see all messages (or filter by receiverRole if needed)
      // For now, fetch all to support the "Support Inbox" view
      q = query(collection(db, 'messages'));
    } else {
      // Regular users only see messages they are part of
      q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', auth.currentUser.uid)
      );
    }

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
      
      // Sort by timestamp asc
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setMessages(msgs);
    }, (error) => {
      console.error("Message subscription error:", error);
    });

    return () => unsubscribe();
  }, [role, selectedReceiver, auth.currentUser]); // Re-run when auth changes

  const sendMessage = async (text: string) => {
    if (!auth.currentUser) return;
    
    await addDoc(collection(db, 'messages'), {
      senderId: auth.currentUser.uid,
      senderRole: role,
      receiverRole: selectedReceiver,
      text,
      timestamp: serverTimestamp(),
      status: 'sent',
      participants: [auth.currentUser.uid]
    });
  };

  return { messages, sendMessage };
}
