import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  Globe,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { Badge, Button, Card, Input } from '../ui';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToEvents } from '../../services/eventService';
import { saveWebsiteConfig } from '../../services/websiteService';
import WeddingWebsitePreview from './WeddingWebsitePreview';
import {
  WEBSITE_THEMES,
  getCoupleDisplayName,
  getPublicWeddingWebsiteLink,
  normalizeWebsiteConfig,
  sanitizeWebsiteConfig,
} from './websiteThemes';

const websiteThemes = Object.values(WEBSITE_THEMES);

function Toggle({ checked, onChange, label, disabled = false, helperText }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl border border-gray-200 px-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 rounded-full transition ${checked ? 'bg-rose-600' : 'bg-gray-300'}`}
        disabled={disabled}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </label>
  );
}

function formatEventSummary(event) {
  const dateLabel = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';
  const timeLabel = [event?.startTime, event?.endTime].filter(Boolean).join(' - ');
  return [dateLabel, timeLabel].filter(Boolean).join(' • ');
}

function updateArrayItem(items, index, field, value) {
  return items.map((item, itemIndex) => (
    itemIndex === index ? { ...item, [field]: value } : item
  ));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image file'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to load image'));
      image.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process image'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function WebsiteBuilder() {
  const { activeWedding, canEdit, isViewer } = useWedding();
  const [events, setEvents] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [config, setConfig] = useState(() => normalizeWebsiteConfig());
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!activeWedding) return undefined;
    return subscribeToEvents(activeWedding.id, setEvents);
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding) return;
    setConfig(normalizeWebsiteConfig(activeWedding, events.map((event) => event.id)));
  }, [activeWedding, events]);

  const websiteUrl = activeWedding ? getPublicWeddingWebsiteLink(activeWedding.id) : '';
  const selectedEventIds = new Set(config.websiteEventIds || []);
  const coupleDisplayName = getCoupleDisplayName(activeWedding);

  const selectedEventsCount = events.filter((event) => selectedEventIds.has(event.id)).length;

  if (!activeWedding) return null;

  const setHeroValue = (field, value) => {
    setConfig((current) => ({
      ...current,
      websiteHero: { ...current.websiteHero, [field]: value },
    }));
  };

  const updateSection = (field, value) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const handleEventToggle = (eventId) => {
    setConfig((current) => {
      const existing = new Set(current.websiteEventIds || []);
      if (existing.has(eventId)) existing.delete(eventId);
      else existing.add(eventId);
      return { ...current, websiteEventIds: Array.from(existing) };
    });
  };

  const handleAddHotel = () => {
    updateSection('websiteHotels', {
      ...config.websiteHotels,
      items: [...config.websiteHotels.items, { name: '', address: '', link: '', groupRateCode: '' }],
    });
  };

  const handleAddRegistry = () => {
    updateSection('websiteRegistry', {
      ...config.websiteRegistry,
      items: [...config.websiteRegistry.items, { name: '', url: '' }],
    });
  };

  const handleSave = async (published = config.websitePublished) => {
    setSaving(true);
    try {
      const nextConfig = sanitizeWebsiteConfig({ ...config, websitePublished: published });
      await saveWebsiteConfig(activeWedding.id, nextConfig);
      setConfig(nextConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setHeroValue('backgroundImage', dataUrl);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className="overflow-hidden"
        actions={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant={previewMode ? 'outline' : 'secondary'}
              onClick={() => setPreviewMode(false)}
            >
              <Pencil size={14} />
              Edit
            </Button>
            <Button
              size="sm"
              variant={previewMode ? 'secondary' : 'outline'}
              onClick={() => setPreviewMode(true)}
            >
              <Eye size={14} />
              Preview
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy size={14} />
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleSave()} disabled={saving}>
                  <Save size={14} />
                  {config.websitePublished ? 'Save Changes' : 'Save Draft'}
                </Button>
                <Button size="sm" onClick={() => handleSave(!config.websitePublished)} disabled={saving}>
                  <Send size={14} />
                  {config.websitePublished ? 'Unpublish' : 'Publish'}
                </Button>
              </>
            )}
          </div>
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={config.websitePublished ? 'success' : 'warning'}>
            {config.websitePublished ? 'Published' : 'Draft'}
          </Badge>
          <div className="text-sm text-gray-500">
            Shareable link: <span className="font-medium text-gray-700">{websiteUrl}</span>
          </div>
          {isViewer && (
            <Badge variant="info">Read-only</Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {!previewMode && (
          <div className="space-y-6">
            <Card title="Theme Picker">
              <div className="grid gap-4 md:grid-cols-2">
                {websiteThemes.map((theme) => {
                  const selected = config.websiteTheme === theme.key;
                  return (
                    <button
                      key={theme.key}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => canEdit && updateSection('websiteTheme', theme.key)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selected ? 'border-rose-500 ring-2 ring-rose-100' : 'border-gray-200 hover:border-gray-300'
                      } ${canEdit ? '' : 'cursor-default'}`}
                      style={{ backgroundColor: theme.background }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div
                          className="h-12 w-12 rounded-2xl"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                        />
                        {selected && <Check className="text-rose-600" size={18} />}
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{theme.name}</p>
                      <p className="mt-1 text-sm text-gray-600">{theme.description}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-500">{theme.fontName}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card title="Hero Section">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Couple Names" value={coupleDisplayName} disabled />
                <Input
                  label="Wedding Date"
                  type="date"
                  value={config.websiteHero.date}
                  onChange={(event) => setHeroValue('date', event.target.value)}
                  disabled={!canEdit}
                />
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tagline or Quote</label>
                  <textarea
                    value={config.websiteHero.tagline}
                    onChange={(event) => setHeroValue('tagline', event.target.value)}
                    rows={3}
                    disabled={!canEdit}
                    placeholder="A joyful weekend of love, laughter, and forever."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Hero Background Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium ${canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default bg-gray-50 text-gray-500'}`}>
                      <input type="file" accept="image/*" className="hidden" disabled={!canEdit} onChange={handleImageUpload} />
                      <ImagePlus size={16} />
                      {uploading ? 'Uploading...' : config.websiteHero.backgroundImage ? 'Replace Image' : 'Upload Image'}
                    </label>
                    {config.websiteHero.backgroundImage && canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setHeroValue('backgroundImage', '')}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Images are optimized before saving so your page loads quickly for guests.
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Public Events">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-rose-900">{selectedEventsCount} event{selectedEventsCount === 1 ? '' : 's'} visible</p>
                  <p className="text-xs text-rose-700">Select the celebrations guests should see on the public website.</p>
                </div>
                <Globe className="text-rose-500" size={20} />
              </div>

              <div className="space-y-3">
                {events.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                    Add events in the Events page to feature them on your website.
                  </p>
                )}
                {events.map((event) => {
                  const checked = selectedEventIds.has(event.id);
                  return (
                    <label
                      key={event.id}
                      className={`flex items-start gap-4 rounded-2xl border px-4 py-4 ${checked ? 'border-rose-200 bg-rose-50' : 'border-gray-200'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        checked={checked}
                        onChange={() => handleEventToggle(event.id)}
                        disabled={!canEdit}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                          {event.dressCode && <Badge variant="rose">{event.dressCode}</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{formatEventSummary(event)}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {[event.venue, event.address].filter(Boolean).join(' • ') || 'Venue details to come'}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>

            <Card title="Our Story">
              <div className="space-y-4">
                <Toggle
                  checked={config.websiteStory.enabled}
                  onChange={(enabled) => updateSection('websiteStory', { ...config.websiteStory, enabled })}
                  disabled={!canEdit}
                  label="Show our story"
                  helperText="Share how you met, the proposal, or what this celebration means to you."
                />
                <textarea
                  value={config.websiteStory.text}
                  onChange={(event) => updateSection('websiteStory', { ...config.websiteStory, text: event.target.value })}
                  rows={6}
                  disabled={!canEdit}
                  placeholder="Tell your story here..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </Card>

            <Card
              title="Travel & Accommodation"
              actions={canEdit ? (
                <Button size="sm" variant="outline" onClick={handleAddHotel}>
                  <Plus size={14} />
                  Add Hotel
                </Button>
              ) : null}
            >
              <div className="space-y-4">
                <Toggle
                  checked={config.websiteHotels.enabled}
                  onChange={(enabled) => updateSection('websiteHotels', { ...config.websiteHotels, enabled })}
                  disabled={!canEdit}
                  label="Show hotels and travel details"
                  helperText="Recommend hotel blocks, nearby stays, and booking links."
                />
                {config.websiteHotels.items.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                    Add one or more hotel blocks to help guests plan their stay.
                  </p>
                )}
                {config.websiteHotels.items.map((hotel, index) => (
                  <div key={`hotel-${index}`} className="rounded-2xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Hotel {index + 1}</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateSection('websiteHotels', {
                            ...config.websiteHotels,
                            items: config.websiteHotels.items.filter((_, itemIndex) => itemIndex !== index),
                          })}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="Hotel Name"
                        value={hotel.name}
                        onChange={(event) => updateSection('websiteHotels', {
                          ...config.websiteHotels,
                          items: updateArrayItem(config.websiteHotels.items, index, 'name', event.target.value),
                        })}
                        disabled={!canEdit}
                      />
                      <Input
                        label="Group Rate Code"
                        value={hotel.groupRateCode}
                        onChange={(event) => updateSection('websiteHotels', {
                          ...config.websiteHotels,
                          items: updateArrayItem(config.websiteHotels.items, index, 'groupRateCode', event.target.value),
                        })}
                        disabled={!canEdit}
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Address"
                          value={hotel.address}
                          onChange={(event) => updateSection('websiteHotels', {
                            ...config.websiteHotels,
                            items: updateArrayItem(config.websiteHotels.items, index, 'address', event.target.value),
                          })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Booking Link"
                          value={hotel.link}
                          onChange={(event) => updateSection('websiteHotels', {
                            ...config.websiteHotels,
                            items: updateArrayItem(config.websiteHotels.items, index, 'link', event.target.value),
                          })}
                          disabled={!canEdit}
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Registry Links"
              actions={canEdit ? (
                <Button size="sm" variant="outline" onClick={handleAddRegistry}>
                  <Plus size={14} />
                  Add Registry
                </Button>
              ) : null}
            >
              <div className="space-y-4">
                <Toggle
                  checked={config.websiteRegistry.enabled}
                  onChange={(enabled) => updateSection('websiteRegistry', { ...config.websiteRegistry, enabled })}
                  disabled={!canEdit}
                  label="Show registry links"
                  helperText="Add any external registries or gifting pages you'd like guests to visit."
                />
                {config.websiteRegistry.items.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                    Add a store name and URL for each registry.
                  </p>
                )}
                {config.websiteRegistry.items.map((registry, index) => (
                  <div key={`registry-${index}`} className="rounded-2xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Registry {index + 1}</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateSection('websiteRegistry', {
                            ...config.websiteRegistry,
                            items: config.websiteRegistry.items.filter((_, itemIndex) => itemIndex !== index),
                          })}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="Store Name"
                        value={registry.name}
                        onChange={(event) => updateSection('websiteRegistry', {
                          ...config.websiteRegistry,
                          items: updateArrayItem(config.websiteRegistry.items, index, 'name', event.target.value),
                        })}
                        disabled={!canEdit}
                      />
                      <Input
                        label="URL"
                        value={registry.url}
                        onChange={(event) => updateSection('websiteRegistry', {
                          ...config.websiteRegistry,
                          items: updateArrayItem(config.websiteRegistry.items, index, 'url', event.target.value),
                        })}
                        disabled={!canEdit}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Footer Message">
              <textarea
                value={config.websiteFooter}
                onChange={(event) => updateSection('websiteFooter', event.target.value)}
                rows={3}
                disabled={!canEdit}
                placeholder="We can't wait to celebrate with you!"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </Card>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              <p className="text-sm text-gray-500">Exactly what guests see at your public link.</p>
            </div>
            <Badge variant="rose">/w/{activeWedding.id}</Badge>
          </div>
          <WeddingWebsitePreview
            wedding={activeWedding}
            config={config}
            events={events}
            previewMode
          />
        </div>
      </div>
    </div>
  );
}
