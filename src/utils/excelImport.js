import * as XLSX from 'xlsx';

// Default column mapping for Indian wedding guest lists
const DEFAULT_COLUMN_MAP = {
  'first name': 'firstName',
  'firstname': 'firstName',
  'first': 'firstName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'last': 'lastName',
  'name': '_fullName',
  'full name': '_fullName',
  'email': 'email',
  'phone': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'family': 'familyName',
  'family name': 'familyName',
  'side': 'side',
  'relation': 'relation',
  'relationship': 'relation',
  'table': 'tableNumber',
  'table number': 'tableNumber',
  'table #': 'tableNumber',
  'dietary': 'dietary',
  'diet': 'dietary',
  'food': 'dietary',
  'veg/non-veg': 'dietary',
  'notes': 'notes',
  'tags': '_tags',
  'plus one': 'plusOne',
  '+1': 'plusOne',
};

/**
 * Parse an Excel or CSV file into an array of row objects.
 * Returns { headers: string[], rows: object[], rawData: any[][] }
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rawData.length < 2) {
          return reject(new Error('File must have a header row and at least one data row'));
        }

        const headers = rawData[0].map((h) => String(h || '').trim());
        const rows = rawData.slice(1)
          .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))
          .map((row) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = row[i] !== undefined ? String(row[i]).trim() : '';
            });
            return obj;
          });

        resolve({ headers, rows, rawData });
      } catch (err) {
        reject(new Error('Failed to parse file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detect column mapping from headers.
 * Returns { [headerName]: guestFieldName }
 */
export function autoMapColumns(headers) {
  const mapping = {};
  headers.forEach((header) => {
    const key = header.toLowerCase().trim();
    if (DEFAULT_COLUMN_MAP[key]) {
      mapping[header] = DEFAULT_COLUMN_MAP[key];
    }
  });
  return mapping;
}

/**
 * Transform raw rows using column mapping into guest objects.
 */
export function mapRowsToGuests(rows, columnMapping) {
  return rows.map((row) => {
    const guest = {};

    Object.entries(columnMapping).forEach(([header, field]) => {
      const value = row[header] || '';

      if (field === '_fullName') {
        // Split "First Last" into firstName + lastName
        const parts = value.split(/\s+/);
        guest.firstName = parts[0] || '';
        guest.lastName = parts.slice(1).join(' ') || '';
      } else if (field === '_tags') {
        guest.tags = value.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
      } else if (field === 'plusOne') {
        guest.plusOne = ['yes', 'true', '1', 'y'].includes(value.toLowerCase());
      } else if (field === 'tableNumber') {
        const num = parseInt(value, 10);
        guest.tableNumber = isNaN(num) ? null : num;
      } else if (field === 'side') {
        guest.side = value.toLowerCase().includes('groom') ? 'groom' : 'bride';
      } else if (field === 'dietary') {
        const lower = value.toLowerCase();
        if (lower.includes('jain')) guest.dietary = 'jain';
        else if (lower.includes('vegan')) guest.dietary = 'vegan';
        else if (lower.includes('non')) guest.dietary = 'non-veg';
        else guest.dietary = 'vegetarian';
      } else {
        guest[field] = value;
      }
    });

    return guest;
  });
}

/**
 * Find potential duplicates in a list of guests.
 */
export function findDuplicates(existingGuests, newGuests) {
  return newGuests.map((ng, idx) => {
    const match = existingGuests.find(
      (eg) =>
        (eg.firstName?.toLowerCase() === ng.firstName?.toLowerCase() &&
          eg.lastName?.toLowerCase() === ng.lastName?.toLowerCase()) ||
        (ng.email && eg.email?.toLowerCase() === ng.email?.toLowerCase()) ||
        (ng.phone && eg.phone === ng.phone)
    );
    return match ? { index: idx, existing: match, incoming: ng } : null;
  }).filter(Boolean);
}

/**
 * Export guests to Excel file and trigger download.
 */
export function exportGuestsToExcel(guests, fileName = 'guest-list.xlsx') {
  const data = guests.map((g) => ({
    'First Name': g.firstName,
    'Last Name': g.lastName,
    'Email': g.email,
    'Phone': g.phone,
    'Family': g.familyName,
    'Side': g.side,
    'Relation': g.relation,
    'Dietary': g.dietary,
    'Table #': g.tableNumber || '',
    'Plus One': g.plusOne ? 'Yes' : 'No',
    'Tags': (g.tags || []).join(', '),
    'Notes': g.notes,
    'Hotel Needed': g.needsHotel ? 'Yes' : 'No',
    'Traveling From': g.travelFrom,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');
  XLSX.writeFile(wb, fileName);
}

/**
 * Download an Excel template with example data for guest import.
 */
export function downloadGuestTemplate() {
  const exampleData = [
    {
      'First Name': 'Priya',
      'Last Name': 'Sharma',
      'Email': 'priya.sharma@email.com',
      'Phone': '555-0101',
      'Family': 'The Sharma Family',
      'Side': 'Bride',
      'Relation': 'Cousin',
      'Dietary': 'Vegetarian',
      'Table #': 1,
      'Plus One': 'No',
      'Tags': 'VIP',
      'Notes': '',
      'Hotel Needed': 'Yes',
      'Traveling From': 'Mumbai',
    },
    {
      'First Name': 'Raj',
      'Last Name': 'Sharma',
      'Email': 'raj.sharma@email.com',
      'Phone': '555-0102',
      'Family': 'The Sharma Family',
      'Side': 'Bride',
      'Relation': 'Uncle',
      'Dietary': 'Vegetarian',
      'Table #': 1,
      'Plus One': 'Yes',
      'Tags': 'VIP, Elderly',
      'Notes': 'Needs wheelchair accessible seating',
      'Hotel Needed': 'Yes',
      'Traveling From': 'Mumbai',
    },
    {
      'First Name': 'Anita',
      'Last Name': 'Patel',
      'Email': 'anita.p@email.com',
      'Phone': '555-0201',
      'Family': 'The Patel Family',
      'Side': 'Groom',
      'Relation': 'Family Friend',
      'Dietary': 'Jain (No onion/garlic)',
      'Table #': 3,
      'Plus One': 'No',
      'Tags': '',
      'Notes': '',
      'Hotel Needed': 'No',
      'Traveling From': '',
    },
    {
      'First Name': 'Vikram',
      'Last Name': 'Mehta',
      'Email': '',
      'Phone': '555-0301',
      'Family': 'The Mehta Family',
      'Side': 'Groom',
      'Relation': 'College Friend',
      'Dietary': 'Non-Vegetarian',
      'Table #': '',
      'Plus One': 'Yes',
      'Tags': 'College Friend',
      'Notes': 'Coming with wife Neha',
      'Hotel Needed': 'Yes',
      'Traveling From': 'Chicago',
    },
    {
      'First Name': 'Sita',
      'Last Name': 'Reddy',
      'Email': 'sita.r@email.com',
      'Phone': '',
      'Family': 'The Reddy Family',
      'Side': 'Bride',
      'Relation': 'Aunt',
      'Dietary': 'Vegan',
      'Table #': 2,
      'Plus One': 'No',
      'Tags': 'Elderly',
      'Notes': 'Needs vegetarian + no dairy options',
      'Hotel Needed': 'Yes',
      'Traveling From': 'Hyderabad',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 12 },
    { wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 22 },
    { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 36 },
    { wch: 14 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guest Template');
  XLSX.writeFile(wb, 'phera-guest-template.xlsx');
}
