import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  MonitorPlay,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../config/constants';
import { useWedding } from '../../contexts/WeddingContext';
import { Badge, Button, Card, Modal } from '../ui';
import {
  addGroup,
  deleteGroup,
  getPhotoDisplayLink,
  getPhotoQueueLink,
  markCompleted,
  parseMembers,
  reorderGroups,
  setCurrentGroup,
  subscribeToGroups,
  updateGroup,
} from '../../services/photoGroupService';

function getWeddingLabel(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Wedding Photos';
}

function useWeddingPublicData(weddingId) {
  const [wedding, setWedding] = useState(null);

  useEffect(() => {
    if (!weddingId) {
      setWedding(null);
      return undefined;
    }

    return onSnapshot(doc(db, COLLECTIONS.WEDDINGS, weddingId), (snap) => {
      setWedding(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [weddingId]);

  return wedding;
}

function usePhotoGroups(weddingId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setGroups([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToGroups(weddingId, (nextGroups) => {
      setGroups(nextGroups);
      setLoading(false);
    });

    return unsubscribe;
  }, [weddingId]);

  return { groups, loading };
}

function getQueueState(groups) {
  const sortedGroups = [...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentGroup = sortedGroups.find((group) => group.status === 'current') || null;
  const pendingGroups = sortedGroups.filter((group) => group.status !== 'completed' && group.id !== currentGroup?.id);
  const completedGroups = sortedGroups.filter((group) => group.status === 'completed');

  return {
    sortedGroups,
    currentGroup,
    pendingGroups,
    completedGroups,
  };
}

function PhotoGroupFormModal({ group, open, onClose, onSubmit }) {
  const [name, setName] = useState(group?.name || '');
  const [membersText, setMembersText] = useState((group?.members || []).join(', '));

  useEffect(() => {
    setName(group?.name || '');
    setMembersText((group?.members || []).join(', '));
  }, [group]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      members: parseMembers(membersText),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Edit photo group' : 'Add photo group'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Group name</label>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Bride's cousins"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Members</label>
          <textarea
            value={membersText}
            onChange={(event) => setMembersText(event.target.value)}
            rows={4}
            placeholder="One per line or separated by commas"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{group ? 'Save changes' : 'Add group'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ShareLinkCard({ title, description, url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy link', error);
    }
  };

  return (
    <div className="rounded-xl border border-wine-100 bg-wine-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <p className="mt-2 truncate text-xs text-wine-800">{url}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

function PhotoGroupAdminCard({
  group,
  index,
  canEdit,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetCurrent,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusVariant = group.status === 'current'
    ? 'rose'
    : group.status === 'completed'
      ? 'success'
      : 'default';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
          disabled={!canEdit}
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">#{index + 1}</span>
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            <Badge variant={statusVariant}>{group.status}</Badge>
          </div>
          {group.members?.length > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{group.members.join(' · ')}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onMoveUp} disabled={!canEdit || index === 0}>
              <ChevronUp size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={onMoveDown} disabled={!canEdit}>
              <ChevronDown size={16} />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onSetCurrent} disabled={!canEdit || group.status === 'completed'}>
              <Camera size={15} />
              {group.status === 'current' ? 'Live' : 'Set current'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit} disabled={!canEdit}>
              <Pencil size={15} />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={!canEdit} className="text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPhotoGroupManager({ wedding }) {
  const { groups, loading } = usePhotoGroups(wedding?.id);
  const { currentGroup, pendingGroups, completedGroups, sortedGroups } = useMemo(() => getQueueState(groups), [groups]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const { canEdit, isViewer } = useWedding();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const queueLink = wedding?.id ? getPhotoQueueLink(wedding.id) : '';
  const displayLink = wedding?.id ? getPhotoDisplayLink(wedding.id) : '';

  const handleSaveGroup = async (payload) => {
    if (!wedding?.id) return;

    if (editingGroup) {
      await updateGroup(wedding.id, editingGroup.id, payload);
    } else {
      await addGroup(wedding.id, payload);
    }

    setModalOpen(false);
    setEditingGroup(null);
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!canEdit || !over || active.id === over.id) return;

    const oldIndex = sortedGroups.findIndex((group) => group.id === active.id);
    const newIndex = sortedGroups.findIndex((group) => group.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...sortedGroups];
    const [movedGroup] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedGroup);
    await reorderGroups(wedding.id, reordered);
  };

  const handleMove = async (groupId, direction) => {
    const index = sortedGroups.findIndex((group) => group.id === groupId);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || nextIndex < 0 || nextIndex >= sortedGroups.length) return;

    const reordered = [...sortedGroups];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    await reorderGroups(wedding.id, reordered);
  };

  const handleMarkCompleted = async () => {
    if (!currentGroup) return;
    const nextGroup = pendingGroups.find((group) => group.id !== currentGroup.id && group.status !== 'completed');
    await markCompleted(wedding.id, currentGroup.id, nextGroup?.id || null);
  };

  if (!wedding) {
    return (
      <Card title="Photo Groups">
        <p className="text-sm text-gray-500">Select a wedding to manage the photo queue.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Groups</h1>
          <p className="mt-1 text-sm text-gray-500">Run a live queue for photographers, the MC, guests, and the venue display.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(queueLink, '_blank')} disabled={!wedding?.id}>
            <Users size={16} />
            Guest queue
          </Button>
          <Button variant="outline" onClick={() => window.open(displayLink, '_blank')} disabled={!wedding?.id}>
            <MonitorPlay size={16} />
            Display view
          </Button>
          <Button onClick={() => { setEditingGroup(null); setModalOpen(true); }} disabled={!canEdit}>
            <Plus size={16} />
            Add group
          </Button>
        </div>
      </div>

      {isViewer && (
        <Card>
          <p className="text-sm text-amber-700">You have viewer access. Share links and live status are visible, but editing is disabled.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-wine-100">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{pendingGroups.filter((group) => group.status === 'pending').length}</p>
            </Card>
            <Card className="border-wine-100">
              <p className="text-sm text-gray-500">Current</p>
              <p className="mt-2 text-3xl font-bold text-wine-700">{currentGroup ? 1 : 0}</p>
            </Card>
            <Card className="border-wine-100">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
            </Card>
          </div>

          <Card
            title="Now on stage"
            actions={currentGroup && canEdit ? <Button size="sm" onClick={handleMarkCompleted}>Mark complete</Button> : null}
            className="border-wine-100"
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading queue…</p>
            ) : currentGroup ? (
              <div className="rounded-2xl bg-gradient-to-r from-wine-700 to-wine-600 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-wine-100">Current group</p>
                <h2 className="mt-3 text-3xl font-bold">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-3 text-sm leading-relaxed text-wine-50">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="font-medium text-gray-900">No group is live right now.</p>
                <p className="mt-1 text-sm text-gray-500">Set any queued group as current to start the display.</p>
              </div>
            )}
          </Card>

          <Card title="Queue" className="border-wine-100">
            {sortedGroups.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="font-medium text-gray-900">No photo groups yet.</p>
                <p className="mt-1 text-sm text-gray-500">Add your first family or friend group to begin the queue.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedGroups.map((group) => group.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {sortedGroups.map((group, index) => (
                      <PhotoGroupAdminCard
                        key={group.id}
                        group={group}
                        index={index}
                        canEdit={canEdit}
                        onEdit={() => {
                          setEditingGroup(group);
                          setModalOpen(true);
                        }}
                        onDelete={() => deleteGroup(wedding.id, group.id)}
                        onMoveUp={() => handleMove(group.id, 'up')}
                        onMoveDown={() => handleMove(group.id, 'down')}
                        onSetCurrent={() => setCurrentGroup(wedding.id, group.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Shareable links" className="border-wine-100">
            <div className="space-y-3">
              <ShareLinkCard
                title="Guest queue"
                description="A public queue guests can open on any phone to see who's up next."
                url={queueLink}
              />
              <ShareLinkCard
                title="Display screen"
                description="A clean big-screen layout for TVs or projectors near the stage."
                url={displayLink}
              />
            </div>
          </Card>

          <Card title="Up next" className="border-wine-100">
            <div className="space-y-3">
              {pendingGroups.filter((group) => group.status === 'pending').slice(0, 5).map((group, index) => (
                <div key={group.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <Badge>{index === 0 ? 'On deck' : `#${index + 1}`}</Badge>
                  </div>
                  {group.members?.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">{group.members.join(' · ')}</p>
                  )}
                </div>
              ))}
              {pendingGroups.filter((group) => group.status === 'pending').length === 0 && (
                <p className="text-sm text-gray-500">No upcoming groups right now.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <PhotoGroupFormModal
        open={modalOpen}
        group={editingGroup}
        onClose={() => {
          setModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleSaveGroup}
      />
    </div>
  );
}

function PublicQueueShell({ wedding, groups, loading, displayMode = false }) {
  const { currentGroup, pendingGroups, completedGroups } = useMemo(() => getQueueState(groups), [groups]);
  const weddingLabel = getWeddingLabel(wedding);
  const nextGroups = pendingGroups.filter((group) => group.status === 'pending');

  if (displayMode) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-12 sm:px-10">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-wine-200/80">Photo Queue</p>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-6xl">{weddingLabel}</h1>
          </header>

          <div className="flex flex-1 items-center justify-center py-12">
            {loading ? (
              <p className="text-xl text-gray-300">Loading queue…</p>
            ) : currentGroup ? (
              <div className="max-w-5xl text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-wine-600/20 px-4 py-2 text-sm text-wine-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-wine-400 animate-pulse" />
                  Now on stage
                </div>
                <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-6 text-xl leading-relaxed text-gray-300 sm:text-2xl">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Camera className="mx-auto text-wine-300" size={60} />
                <h2 className="mt-5 text-4xl font-semibold">{completedGroups.length > 0 && nextGroups.length === 0 ? 'All groups complete' : 'Beginning shortly'}</h2>
              </div>
            )}
          </div>

          {nextGroups.length > 0 && (
            <section className="border-t border-white/10 pt-8">
              <p className="text-center text-xs uppercase tracking-[0.4em] text-gray-400">Coming up</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {nextGroups.slice(0, 3).map((group, index) => (
                  <div key={group.id} className={`rounded-2xl border p-5 ${index === 0 ? 'border-wine-400/40 bg-wine-600/10' : 'border-white/10 bg-white/5'}`}>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{index === 0 ? 'On deck' : `Next ${index + 1}`}</p>
                    <h3 className="mt-3 text-2xl font-semibold">{group.name}</h3>
                    {group.members?.length > 0 && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-300">{group.members.slice(0, 4).join(' · ')}{group.members.length > 4 ? ` +${group.members.length - 4}` : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-amber-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">Photo Queue</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{weddingLabel}</h1>
          <p className="mt-3 text-sm text-gray-500">Follow the live queue and be ready when your group is on deck.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-wine-100">
            {loading ? (
              <p className="text-sm text-gray-500">Loading queue…</p>
            ) : currentGroup ? (
              <div>
                <Badge variant="rose">Now taking photos</Badge>
                <h2 className="mt-4 text-3xl font-bold text-gray-900">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-3 text-base leading-relaxed text-gray-600">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Camera className="mx-auto text-wine-400" size={36} />
                <p className="mt-4 text-lg font-semibold text-gray-900">No group is live yet</p>
                <p className="mt-1 text-sm text-gray-500">Check back in a moment for the next call.</p>
              </div>
            )}
          </Card>

          <Card title="Up next" className="border-wine-100">
            <div className="space-y-3">
              {nextGroups.slice(0, 5).map((group, index) => (
                <div key={group.id} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <Badge>{index === 0 ? 'On deck' : `#${index + 1}`}</Badge>
                  </div>
                  {group.members?.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">{group.members.join(' · ')}</p>
                  )}
                </div>
              ))}
              {nextGroups.length === 0 && <p className="text-sm text-gray-500">No groups waiting in the queue.</p>}
            </div>
          </Card>
        </div>

        <Card title="Full queue" className="mt-6 border-wine-100">
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <Badge
                    variant={group.status === 'current' ? 'rose' : group.status === 'completed' ? 'success' : 'default'}
                  >
                    {group.status}
                  </Badge>
                </div>
                {group.members?.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">{group.members.join(' · ')}</p>
                )}
              </div>
            ))}
            {groups.length === 0 && !loading && <p className="text-sm text-gray-500">The queue has not been set up yet.</p>}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function PhotoGroupManager() {
  const { activeWedding } = useWedding();
  return <AdminPhotoGroupManager wedding={activeWedding} />;
}

export function PublicPhotoGroupQueue() {
  const { weddingId } = useParams();
  const wedding = useWeddingPublicData(weddingId);
  const { groups, loading } = usePhotoGroups(weddingId);

  return <PublicQueueShell wedding={wedding} groups={groups} loading={loading} />;
}

export function PhotoGroupDisplayView() {
  const { weddingId } = useParams();
  const wedding = useWeddingPublicData(weddingId);
  const { groups, loading } = usePhotoGroups(weddingId);

  return <PublicQueueShell wedding={wedding} groups={groups} loading={loading} displayMode />;
}
