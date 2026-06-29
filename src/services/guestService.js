import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function guestsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS);
}

function familiesRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.FAMILIES);
}

// ─── Guest CRUD ─────────────────────────────────────────────────────────────

export async function addGuest(weddingId, guest) {
  const docRef = await addDoc(guestsRef(weddingId), {
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    email: guest.email || '',
    phone: guest.phone || '',
    familyId: guest.familyId || null,
    familyName: guest.familyName || '',
    side: guest.side || 'bride',
    relation: guest.relation || '',
    dietary: guest.dietary || 'vegetarian',
    dietaryNotes: guest.dietaryNotes || '',
    tableNumber: guest.tableNumber || null,
    seatIndex: guest.seatIndex || null,
    rsvpStatus: guest.rsvpStatus || {},
    rsvpMethod: guest.rsvpMethod || 'manual',
    plusOne: guest.plusOne || false,
    plusOneName: guest.plusOneName || '',
    needsHotel: guest.needsHotel || false,
    hotelNotes: guest.hotelNotes || '',
    travelFrom: guest.travelFrom || '',
    arrivalDate: guest.arrivalDate || null,
    departureDate: guest.departureDate || null,
    language: guest.language || 'en',
    notes: guest.notes || '',
    tags: guest.tags || [],
    importedFrom: guest.importedFrom || 'manual',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGuest(weddingId, guestId, data) {
  await updateDoc(doc(guestsRef(weddingId), guestId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGuest(weddingId, guestId) {
  await deleteDoc(doc(guestsRef(weddingId), guestId));
}

export async function deleteGuestsBatch(weddingId, guestIds) {
  const batch = writeBatch(db);
  guestIds.forEach((id) => batch.delete(doc(guestsRef(weddingId), id)));
  await batch.commit();
}

export function subscribeToGuests(weddingId, callback) {
  return onSnapshot(guestsRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// ─── Bulk import ────────────────────────────────────────────────────────────

export async function importGuestsBatch(weddingId, guests) {
  const batch = writeBatch(db);
  const ref = guestsRef(weddingId);

  guests.forEach((guest) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      firstName: guest.firstName || '',
      lastName: guest.lastName || '',
      email: guest.email || '',
      phone: guest.phone || '',
      familyId: guest.familyId || null,
      familyName: guest.familyName || '',
      side: guest.side || 'bride',
      relation: guest.relation || '',
      dietary: guest.dietary || 'vegetarian',
      dietaryNotes: guest.dietaryNotes || '',
      tableNumber: guest.tableNumber || null,
      seatIndex: null,
      rsvpStatus: {},
      rsvpMethod: 'manual',
      plusOne: guest.plusOne || false,
      plusOneName: guest.plusOneName || '',
      needsHotel: false,
      hotelNotes: '',
      travelFrom: '',
      arrivalDate: null,
      departureDate: null,
      language: guest.language || 'en',
      notes: guest.notes || '',
      tags: guest.tags || [],
      importedFrom: 'excel',
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return guests.length;
}

// ─── Bulk update (table assignment, event assignment, etc.) ─────────────────

export async function updateGuestsBatch(weddingId, updates) {
  const batch = writeBatch(db);
  updates.forEach(({ guestId, data }) => {
    batch.update(doc(guestsRef(weddingId), guestId), data);
  });
  await batch.commit();
}

// ─── Family CRUD ────────────────────────────────────────────────────────────

export async function addFamily(weddingId, family) {
  const docRef = await addDoc(familiesRef(weddingId), {
    familyName: family.familyName,
    headOfFamily: family.headOfFamily || null,
    memberIds: family.memberIds || [],
    side: family.side || 'bride',
    address: family.address || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFamily(weddingId, familyId, data) {
  await updateDoc(doc(familiesRef(weddingId), familyId), data);
}

export async function deleteFamily(weddingId, familyId) {
  await deleteDoc(doc(familiesRef(weddingId), familyId));
}

export function subscribeToFamilies(weddingId, callback) {
  return onSnapshot(familiesRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}
