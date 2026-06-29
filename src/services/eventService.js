import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function eventsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.EVENTS);
}

export async function addEvent(weddingId, event) {
  const docRef = await addDoc(eventsRef(weddingId), {
    name: event.name,
    date: event.date || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    venue: event.venue || '',
    address: event.address || '',
    dressCode: event.dressCode || '',
    description: event.description || '',
    inviteAll: event.inviteAll !== undefined ? event.inviteAll : true,
    guestIds: event.guestIds || [],
    order: event.order || 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(weddingId, eventId, data) {
  await updateDoc(doc(eventsRef(weddingId), eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(weddingId, eventId) {
  await deleteDoc(doc(eventsRef(weddingId), eventId));
}

export function subscribeToEvents(weddingId, callback) {
  return onSnapshot(eventsRef(weddingId), (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    callback(list);
  });
}
