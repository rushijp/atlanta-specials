import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function weddingDocRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId);
}

export async function saveWebsiteConfig(weddingId, config) {
  await updateDoc(weddingDocRef(weddingId), {
    ...config,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToWebsite(weddingId, callback) {
  return onSnapshot(weddingDocRef(weddingId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export async function getPublicWebsite(weddingId) {
  const snapshot = await getDoc(weddingDocRef(weddingId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
