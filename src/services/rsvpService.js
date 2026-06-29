import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

// ─── RSVP Settings (per wedding) ────────────────────────────────────────────

function rsvpSettingsRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, 'settings', 'rsvp');
}

export async function getRsvpSettings(weddingId) {
  const snap = await getDoc(rsvpSettingsRef(weddingId));
  return snap.exists() ? snap.data() : null;
}

export async function saveRsvpSettings(weddingId, settings) {
  await setDoc(rsvpSettingsRef(weddingId), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeToRsvpSettings(weddingId, callback) {
  return onSnapshot(rsvpSettingsRef(weddingId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// ─── RSVP Responses (public submissions) ────────────────────────────────────

function responsesRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, 'rsvpResponses');
}

export async function submitRsvpResponse(weddingId, response) {
  const docRef = await addDoc(responsesRef(weddingId), {
    guestId: response.guestId || null,
    familyName: response.familyName || '',
    respondentName: response.respondentName || '',
    phone: response.phone || '',
    email: response.email || '',
    // Per-event responses: { eventId: 'accepted'|'declined' }
    eventResponses: response.eventResponses || {},
    // Family members attending per event: { eventId: [{ name, dietary }] }
    familyMembers: response.familyMembers || {},
    dietary: response.dietary || 'vegetarian',
    dietaryNotes: response.dietaryNotes || '',
    message: response.message || '',
    needsHotel: response.needsHotel || false,
    travelFrom: response.travelFrom || '',
    submittedAt: serverTimestamp(),
    method: response.method || 'web', // 'web' | 'whatsapp' | 'manual'
  });
  return docRef.id;
}

export function subscribeToResponses(weddingId, callback) {
  return onSnapshot(responsesRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// ─── Public RSVP page data (read without auth) ─────────────────────────────

export async function getPublicWeddingData(weddingId) {
  const weddingSnap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  if (!weddingSnap.exists()) return null;

  const wedding = { id: weddingSnap.id, ...weddingSnap.data() };

  // Get events
  const eventsSnap = await getDocs(
    collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.EVENTS)
  );
  const events = eventsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Get RSVP settings
  const settingsSnap = await getDoc(rsvpSettingsRef(weddingId));
  const rsvpSettings = settingsSnap.exists() ? settingsSnap.data() : null;

  return { wedding, events, rsvpSettings };
}

// ─── Guest lookup for RSVP (by phone or name) ──────────────────────────────

export async function lookupGuestForRsvp(weddingId, { phone, name }) {
  const guestsRef = collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS);
  
  if (phone) {
    const q = query(guestsRef, where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  }

  // Fallback: get all guests and fuzzy match by name
  if (name) {
    const snap = await getDocs(guestsRef);
    const normalizedName = name.toLowerCase().trim();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => {
        const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
        return fullName.includes(normalizedName) || normalizedName.includes(fullName);
      });
  }

  return [];
}

// ─── Generate shareable RSVP link ───────────────────────────────────────────

export function getRsvpLink(weddingId) {
  return `${window.location.origin}/rsvp/${weddingId}`;
}

export function getWhatsAppRsvpLink(weddingId, coupleName) {
  const rsvpUrl = getRsvpLink(weddingId);
  const message = encodeURIComponent(
    `🎉 You're invited to ${coupleName}'s wedding! Please RSVP here: ${rsvpUrl}`
  );
  return `https://wa.me/?text=${message}`;
}
