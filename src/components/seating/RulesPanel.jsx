import { useMemo, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from '../ui';
import { buildRuleDescription } from './seatingRules';

const RULE_TYPES = [
  { value: 'keep-together', label: 'Keep Together' },
  { value: 'keep-apart', label: 'Keep Apart' },
  { value: 'dietary-group', label: 'Dietary Grouping' },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export default function RulesPanel({
  open,
  onClose,
  rules,
  guests,
  tables,
  violations,
  onChange,
  onFocusTable,
}) {
  const [form, setForm] = useState({
    type: 'keep-together',
    scope: 'guests',
    primaryGuestId: '',
    secondaryGuestId: '',
    familyName: '',
  });

  const familyOptions = useMemo(
    () => [...new Set(guests.map((guest) => guest.familyName).filter(Boolean))].sort(),
    [guests],
  );

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [guests],
  );

  const resetForm = () => {
    setForm({
      type: 'keep-together',
      scope: 'guests',
      primaryGuestId: '',
      secondaryGuestId: '',
      familyName: '',
    });
  };

  const handleAddRule = () => {
    if (form.type === 'dietary-group') {
      onChange([
        ...rules,
        {
          id: uid(),
          type: 'dietary-group',
          guestIds: [],
          familyName: '',
          description: 'Flag tables with both vegetarian and non-vegetarian guests.',
        },
      ]);
      resetForm();
      return;
    }

    const usesFamily = form.scope === 'family' && form.familyName;
    const guestIds = usesFamily
      ? [form.secondaryGuestId].filter(Boolean)
      : [form.primaryGuestId, form.secondaryGuestId].filter(Boolean);

    if ((!usesFamily && guestIds.length < 2) || (usesFamily && guestIds.length < 1)) {
      return;
    }

    if (!usesFamily && form.primaryGuestId === form.secondaryGuestId) {
      return;
    }

    const baseRule = {
      id: uid(),
      type: form.type,
      guestIds,
      familyName: usesFamily ? form.familyName : '',
    };

    onChange([
      ...rules,
      {
        ...baseRule,
        description: buildRuleDescription(baseRule, guests),
      },
    ]);
    resetForm();
  };

  const handleDeleteRule = (ruleId) => {
    onChange(rules.filter((rule) => rule.id !== ruleId));
  };

  const canAddRule = form.type === 'dietary-group'
    || (form.scope === 'family' ? Boolean(form.familyName && form.secondaryGuestId) : Boolean(form.primaryGuestId && form.secondaryGuestId && form.primaryGuestId !== form.secondaryGuestId));

  return (
    <Modal open={open} onClose={onClose} title="Seating Rules" size="xl">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Add a rule</h3>
            <p className="mt-1 text-xs text-gray-500">Set seating constraints and catch conflicts before you print the chart.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Rule type</label>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {RULE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {form.type !== 'dietary-group' && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">Apply rule to</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'guests', label: 'Two guests' },
                        { value: 'family', label: 'Family + guest' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, scope: option.value, primaryGuestId: '', secondaryGuestId: '', familyName: '' }))}
                          className={`rounded-lg px-3 py-2 text-xs font-medium ${form.scope === option.value ? 'bg-rose-600 text-white' : 'border border-gray-300 bg-white text-gray-600'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.scope === 'family' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Family</label>
                        <select
                          value={form.familyName}
                          onChange={(event) => setForm((current) => ({ ...current, familyName: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select family</option>
                          {familyOptions.map((familyName) => (
                            <option key={familyName} value={familyName}>{familyName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Guest</label>
                        <select
                          value={form.secondaryGuestId}
                          onChange={(event) => setForm((current) => ({ ...current, secondaryGuestId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select guest</option>
                          {sortedGuests.map((guest) => (
                            <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Guest A</label>
                        <select
                          value={form.primaryGuestId}
                          onChange={(event) => setForm((current) => ({ ...current, primaryGuestId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select guest</option>
                          {sortedGuests.map((guest) => (
                            <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Guest B</label>
                        <select
                          value={form.secondaryGuestId}
                          onChange={(event) => setForm((current) => ({ ...current, secondaryGuestId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select guest</option>
                          {sortedGuests.map((guest) => (
                            <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.type === 'dietary-group' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This rule will flag any table that mixes vegetarian/jain/vegan guests with non-vegetarian guests.
                </div>
              )}

              <Button size="sm" onClick={handleAddRule} disabled={!canAddRule}>
                Add Rule
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Current rules</h3>
              <span className="text-xs text-gray-400">{rules.length} total</span>
            </div>

            <div className="space-y-3">
              {rules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                  No rules yet. Add a keep-together, keep-apart, or dietary rule.
                </div>
              ) : rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                        {RULE_TYPES.find((option) => option.value === rule.type)?.label || rule.type}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{buildRuleDescription(rule, guests)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete rule"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className={violations.length > 0 ? 'text-amber-500' : 'text-green-500'} />
            <h3 className="text-sm font-semibold text-gray-900">Current violations</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {violations.length > 0
              ? `${violations.length} issue${violations.length === 1 ? '' : 's'} found across ${tables.length} table${tables.length === 1 ? '' : 's'}.`
              : 'Everything looks good right now.'}
          </p>

          <div className="mt-4 space-y-3">
            {violations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 px-4 py-6 text-center text-sm text-green-700">
                No rule conflicts detected.
              </div>
            ) : violations.map((violation) => (
              <div key={violation.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-950">{violation.message}</p>
                {(violation.tableIds || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {violation.tableIds.map((tableId) => {
                      const table = tables.find((item) => item.id === tableId);
                      if (!table) return null;
                      return (
                        <button
                          key={tableId}
                          type="button"
                          onClick={() => onFocusTable?.(tableId)}
                          className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                        >
                          Jump to {table.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
