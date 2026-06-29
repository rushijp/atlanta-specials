function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getGuestDisplayName(guest) {
  if (!guest) return 'Unknown guest';
  return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || guest.familyName || 'Unknown guest';
}

export function buildRuleDescription(rule, guests = []) {
  const guestsById = new Map(guests.map((guest) => [guest.id, guest]));
  const namedGuests = (rule.guestIds || [])
    .map((guestId) => getGuestDisplayName(guestsById.get(guestId)))
    .filter(Boolean);

  if (rule.type === 'dietary-group') {
    return rule.description || 'Flag tables with both vegetarian and non-vegetarian guests.';
  }

  const leftSide = rule.familyName ? `${rule.familyName} family` : namedGuests[0] || 'Selected guest';
  const rightSide = rule.familyName ? namedGuests.join(', ') : namedGuests.slice(1).join(', ');

  if (rule.type === 'keep-together') {
    return rule.description || `Keep ${leftSide} with ${rightSide || 'the selected group'}.`;
  }

  if (rule.type === 'keep-apart') {
    return rule.description || `Keep ${leftSide} away from ${rightSide || 'the selected group'}.`;
  }

  return rule.description || 'Custom seating rule';
}

function addViolation(violations, tableWarnings, payload) {
  violations.push(payload);
  (payload.tableIds || []).forEach((tableId) => {
    if (!tableWarnings[tableId]) tableWarnings[tableId] = [];
    tableWarnings[tableId].push(payload);
  });
}

function resolveRuleGuests(rule, guests) {
  const familyGuests = rule.familyName
    ? guests.filter((guest) => normalizeText(guest.familyName) === normalizeText(rule.familyName))
    : [];
  const selectedGuests = (rule.guestIds || [])
    .map((guestId) => guests.find((guest) => guest.id === guestId))
    .filter(Boolean);

  return {
    familyGuests,
    selectedGuests,
    allGuests: uniqueById([...familyGuests, ...selectedGuests]),
  };
}

function classifyDietary(dietary) {
  const value = normalizeText(dietary);
  if (['vegetarian', 'vegan', 'jain'].includes(value)) return 'veg';
  if (value === 'non-veg') return 'non-veg';
  return 'other';
}

export function evaluateSeatingRules(rules = [], tables = [], guests = []) {
  const guestToTable = new Map();
  const tablesById = new Map(tables.map((table) => [table.id, table]));

  tables.forEach((table) => {
    (table.assignedGuests || []).forEach((guestId) => {
      guestToTable.set(guestId, table);
    });
  });

  const violations = [];
  const tableWarnings = {};

  rules.forEach((rule) => {
    if (!rule?.type) return;

    if (rule.type === 'dietary-group') {
      tables.forEach((table) => {
        const seatedGuests = (table.assignedGuests || [])
          .map((guestId) => guests.find((guest) => guest.id === guestId))
          .filter(Boolean);
        const hasVeg = seatedGuests.some((guest) => classifyDietary(guest.dietary) === 'veg');
        const hasNonVeg = seatedGuests.some((guest) => classifyDietary(guest.dietary) === 'non-veg');

        if (hasVeg && hasNonVeg) {
          addViolation(violations, tableWarnings, {
            id: `${rule.id}-${table.id}`,
            ruleId: rule.id,
            ruleType: rule.type,
            message: `${table.name} has a mix of vegetarian and non-vegetarian guests.`,
            tableIds: [table.id],
            guestIds: seatedGuests.map((guest) => guest.id),
          });
        }
      });
      return;
    }

    const { familyGuests, selectedGuests, allGuests } = resolveRuleGuests(rule, guests);
    if (allGuests.length < 2) return;

    if (rule.type === 'keep-together') {
      const seatedTables = uniqueById(
        allGuests.map((guest) => guestToTable.get(guest.id)).filter(Boolean),
      );
      const unseatedGuests = allGuests.filter((guest) => !guestToTable.has(guest.id));

      if (seatedTables.length > 1) {
        addViolation(violations, tableWarnings, {
          id: `${rule.id}-split`,
          ruleId: rule.id,
          ruleType: rule.type,
          message: `${buildRuleDescription(rule, guests)} They are currently split across ${seatedTables.map((table) => table.name).join(', ')}.`,
          tableIds: seatedTables.map((table) => table.id),
          guestIds: allGuests.map((guest) => guest.id),
        });
        return;
      }

      if (seatedTables.length === 1 && unseatedGuests.length > 0) {
        addViolation(violations, tableWarnings, {
          id: `${rule.id}-unseated`,
          ruleId: rule.id,
          ruleType: rule.type,
          message: `${buildRuleDescription(rule, guests)} ${unseatedGuests.map(getGuestDisplayName).join(', ')} still need seats.`,
          tableIds: seatedTables.map((table) => table.id),
          guestIds: allGuests.map((guest) => guest.id),
        });
      }
      return;
    }

    if (rule.type === 'keep-apart') {
      const leftGroup = familyGuests.length > 0 ? familyGuests : selectedGuests.slice(0, 1);
      const rightGroup = familyGuests.length > 0 ? selectedGuests : selectedGuests.slice(1);
      if (leftGroup.length === 0 || rightGroup.length === 0) return;

      tables.forEach((table) => {
        const assignedIds = new Set(table.assignedGuests || []);
        const leftPresent = leftGroup.some((guest) => assignedIds.has(guest.id));
        const rightPresent = rightGroup.some((guest) => assignedIds.has(guest.id));

        if (leftPresent && rightPresent) {
          addViolation(violations, tableWarnings, {
            id: `${rule.id}-${table.id}`,
            ruleId: rule.id,
            ruleType: rule.type,
            message: `${buildRuleDescription(rule, guests)} is violated at ${table.name}.`,
            tableIds: [table.id],
            guestIds: [...leftGroup, ...rightGroup].map((guest) => guest.id),
          });
        }
      });
    }
  });

  const violationCount = violations.length;
  const tablesWithWarnings = Object.keys(tableWarnings).length;

  return {
    violations,
    tableWarnings,
    violationCount,
    tablesWithWarnings,
    tablesById,
  };
}

export function getRuleTargetTableIds(rule, tables = [], guests = []) {
  const result = evaluateSeatingRules([rule], tables, guests);
  return [...new Set(result.violations.flatMap((violation) => violation.tableIds || []))];
}
