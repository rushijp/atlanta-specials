import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function seatingDocRef(weddingId, eventId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.SEATING, eventId);
}

export async function getSeating(weddingId, eventId) {
  const snap = await getDoc(seatingDocRef(weddingId, eventId));
  return snap.exists() ? snap.data() : { tables: [], rules: [] };
}

export async function saveSeating(weddingId, eventId, data) {
  await setDoc(seatingDocRef(weddingId, eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeToSeating(weddingId, eventId, callback) {
  return onSnapshot(seatingDocRef(weddingId, eventId), (snap) => {
    callback(snap.exists() ? snap.data() : { tables: [], rules: [] });
  });
}
