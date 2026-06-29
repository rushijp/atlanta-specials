import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

const weddingsRef = collection(db, COLLECTIONS.WEDDINGS);

export async function createWedding(userId, data) {
  const slug = `${data.coupleName1}-and-${data.coupleName2}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const docRef = await addDoc(weddingsRef, {
    ownerId: userId,
    coupleName1: data.coupleName1,
    coupleName2: data.coupleName2,
    weddingDate: data.weddingDate || null,
    city: data.city || '',
    venue: data.venue || '',
    slug,
    settings: {
      rsvpOpen: false,
      publicWebsite: false,
      theme: 'classic',
      language: 'en',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, slug };
}

export async function getWedding(weddingId) {
  const snap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateWedding(weddingId, data) {
  await updateDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWedding(weddingId) {
  await deleteDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
}

export function subscribeToWeddings(userId, callback) {
  const q = query(weddingsRef, where('ownerId', '==', userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}
