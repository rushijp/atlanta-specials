import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function photoGroupsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PHOTO_GROUPS);
}

function groupDocRef(weddingId, groupId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PHOTO_GROUPS, groupId);
}

export function parseMembers(membersInput) {
  if (Array.isArray(membersInput)) {
    return membersInput.map((member) => `${member}`.trim()).filter(Boolean);
  }

  return `${membersInput || ''}`
    .split(/[\n,]+/)
    .map((member) => member.trim())
    .filter(Boolean);
}

async function getOrderedGroups(weddingId) {
  const snap = await getDocs(query(photoGroupsRef(weddingId)));
  return snap.docs
    .map((groupDoc) => ({ id: groupDoc.id, ...groupDoc.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addGroup(weddingId, group) {
  const existingGroups = await getOrderedGroups(weddingId);
  const members = parseMembers(group.members ?? group.membersText);

  const docRef = await addDoc(photoGroupsRef(weddingId), {
    name: group.name?.trim() || 'Untitled group',
    members,
    order: group.order ?? existingGroups.length,
    status: group.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateGroup(weddingId, groupId, data) {
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(data, 'members') || Object.prototype.hasOwnProperty.call(data, 'membersText')) {
    payload.members = parseMembers(data.members ?? data.membersText);
  }

  if (typeof data.name === 'string') {
    payload.name = data.name.trim();
  }

  delete payload.membersText;

  await updateDoc(groupDocRef(weddingId, groupId), payload);
}

export async function deleteGroup(weddingId, groupId) {
  await deleteDoc(groupDocRef(weddingId, groupId));

  const groups = await getOrderedGroups(weddingId);
  await reorderGroups(weddingId, groups);
}

export async function reorderGroups(weddingId, groups) {
  const batch = writeBatch(db);

  groups.forEach((group, index) => {
    batch.update(groupDocRef(weddingId, group.id), {
      order: index,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function setCurrentGroup(weddingId, groupId) {
  const groups = await getOrderedGroups(weddingId);
  const batch = writeBatch(db);

  groups.forEach((group) => {
    const nextStatus = group.id === groupId
      ? 'current'
      : group.status === 'completed'
        ? 'completed'
        : 'pending';

    batch.update(groupDocRef(weddingId, group.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function markCompleted(weddingId, groupId, nextGroupId = null) {
  const groups = await getOrderedGroups(weddingId);
  const batch = writeBatch(db);

  groups.forEach((group) => {
    let nextStatus = group.status || 'pending';

    if (group.id === groupId) {
      nextStatus = 'completed';
    } else if (group.id === nextGroupId) {
      nextStatus = 'current';
    } else if (group.status !== 'completed') {
      nextStatus = 'pending';
    }

    batch.update(groupDocRef(weddingId, group.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export function subscribeToGroups(weddingId, callback) {
  return onSnapshot(photoGroupsRef(weddingId), (snap) => {
    const groups = snap.docs
      .map((groupDoc) => ({ id: groupDoc.id, ...groupDoc.data() }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    callback(groups);
  });
}

export function getPhotoQueueLink(weddingId) {
  return `${window.location.origin}/photos/${weddingId}`;
}

export function getPhotoDisplayLink(weddingId) {
  return `${window.location.origin}/photos/${weddingId}/display`;
}
