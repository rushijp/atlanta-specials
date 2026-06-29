import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { COLLECTIONS } from '../config/constants';

const WeddingContext = createContext(null);

export function WeddingProvider({ children }) {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState([]);
  const [activeWedding, setActiveWedding] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to all weddings owned by the user
  useEffect(() => {
    if (!user) {
      setWeddings([]);
      setActiveWedding(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.WEDDINGS),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWeddings(list);
      // Auto-select first wedding if none active
      setActiveWedding((current) => {
        if (!current && list.length > 0) return list[0];
        return current;
      });
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const selectWedding = async (weddingId) => {
    const docSnap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
    if (docSnap.exists()) {
      setActiveWedding({ id: docSnap.id, ...docSnap.data() });
    }
  };

  const value = {
    weddings,
    activeWedding,
    setActiveWedding,
    selectWedding,
    loading,
  };

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error('useWedding must be used within WeddingProvider');
  return ctx;
}
