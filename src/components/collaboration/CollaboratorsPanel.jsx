import { useState, useEffect } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  subscribeToCollaborators,
  COLLAB_ROLES,
} from '../../services/collaborationService';
import { Button, Modal, Badge, useToast } from '../ui';
import { UserPlus, Trash2, Shield, Eye, Edit3, Crown, Mail } from 'lucide-react';

export default function CollaboratorsPanel() {
  const { activeWedding, canEdit } = useWedding();
  const toast = useToast();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState(COLLAB_ROLES.EDITOR);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWedding) return;
    return subscribeToCollaborators(activeWedding.id, setCollaborators);
  }, [activeWedding]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError('');
    setLoading(true);
    try {
      await addCollaborator(activeWedding.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
        name: inviteName.trim(),
      });
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collabId) => {
    if (!confirm('Remove this collaborator?')) return;
    try {
      await removeCollaborator(activeWedding.id, collabId);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      toast.error('Failed to remove collaborator. Please try again.');
    }
  };

  const handleRoleChange = async (collabId, newRole) => {
    try {
      await updateCollaboratorRole(activeWedding.id, collabId, newRole);
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role. Please try again.');
    }
  };

  const isOwner = activeWedding?.ownerId === user?.uid;

  if (!activeWedding) return null;

  return (
    <div className="space-y-4">
      {/* Owner */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield size={16} className="text-wine-700" />
          Wedding Team
        </h3>

        <div className="space-y-2">
          {/* Owner row */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-wine-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-wine-700 text-white flex items-center justify-center text-sm font-bold">
              <Crown size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {activeWedding.ownerName || user?.email || 'Owner'}
              </div>
              <div className="text-xs text-gray-500">{activeWedding.ownerEmail || user?.email}</div>
            </div>
            <Badge variant="primary">Owner</Badge>
          </div>

          {/* Collaborators */}
          {collaborators.map((collab) => (
            <div key={collab.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                collab.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {collab.role === 'editor' ? <Edit3 size={14} /> : <Eye size={14} />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {collab.name || collab.email}
                </div>
                <div className="text-xs text-gray-500">{collab.email}</div>
              </div>

              {isOwner && (
                <>
                  <select
                    value={collab.role}
                    onChange={(e) => handleRoleChange(collab.id, e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="editor">Editor (full access)</option>
                    <option value="viewer">Viewer (read-only)</option>
                  </select>
                  <button
                    onClick={() => handleRemove(collab.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}

              {!isOwner && (
                <Badge variant={collab.role === 'editor' ? 'primary' : 'default'}>
                  {collab.role === 'editor' ? 'Editor' : 'Viewer'}
                </Badge>
              )}
            </div>
          ))}

          {collaborators.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">
              No collaborators yet. Invite your spouse or parents to help plan!
            </p>
          )}
        </div>

        {isOwner && (
          <Button size="sm" className="mt-3 w-full" onClick={() => setShowInvite(true)}>
            <UserPlus size={14} /> Invite Collaborator
          </Button>
        )}
      </div>

      {/* Role info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Roles</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <Crown size={12} className="text-wine-700 mt-0.5 flex-shrink-0" />
            <div><strong>Owner</strong> — Full control, manage collaborators, delete wedding</div>
          </div>
          <div className="flex items-start gap-2">
            <Edit3 size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div><strong>Editor</strong> — Add/edit guests, events, seating, RSVP. Perfect for spouse</div>
          </div>
          <div className="flex items-start gap-2">
            <Eye size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div><strong>Viewer</strong> — See everything, change nothing. Great for parents</div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setError(''); }} title="Invite Collaborator" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Invite your spouse, parents, or wedding planner to help manage your wedding.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Mom, Brijal, Wedding Planner"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="their-email@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
            <p className="text-xs text-gray-400 mt-1">They'll need to sign up with this email to access the wedding</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setInviteRole(COLLAB_ROLES.EDITOR)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  inviteRole === 'editor'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Edit3 size={14} className="text-blue-600" />
                  <span className="text-sm font-medium">Editor</span>
                </div>
                <p className="text-xs text-gray-500">Full access — can add guests, edit events, manage seating</p>
              </button>
              <button
                onClick={() => setInviteRole(COLLAB_ROLES.VIEWER)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  inviteRole === 'viewer'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={14} className="text-gray-600" />
                  <span className="text-sm font-medium">Viewer</span>
                </div>
                <p className="text-xs text-gray-500">Read-only — can see everything but can't make changes</p>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button onClick={handleInvite} className="w-full" disabled={loading || !inviteEmail.trim()}>
            {loading ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
