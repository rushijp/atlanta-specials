import jsPDF from 'jspdf';

// ─── Place Cards PDF ────────────────────────────────────────────────────────
// Generates printable place cards (tent-fold style) on letter/A4 paper
// Layout: 2 columns × 5 rows = 10 cards per page

export function generatePlaceCardsPDF(guests, options = {}) {
  const {
    eventName = '',
    showTable = true,
    showDietary = true,
    showFamily = false,
    cardStyle = 'elegant', // 'elegant' | 'modern' | 'minimal'
    paperSize = 'letter',  // 'letter' | 'a4'
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paperSize });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const cols = 2;
  const rows = 5;
  const cardW = (pageW - margin * 2 - 5) / cols;
  const cardH = (pageH - margin * 2 - 4 * 2) / rows;
  const gap = 2;

  const styles = {
    elegant: { nameSize: 14, subSize: 8, nameFontStyle: 'bold', borderColor: [180, 130, 100] },
    modern: { nameSize: 13, subSize: 8, nameFontStyle: 'bold', borderColor: [100, 100, 100] },
    minimal: { nameSize: 12, subSize: 7, nameFontStyle: 'normal', borderColor: [200, 200, 200] },
  };
  const style = styles[cardStyle] || styles.elegant;

  let cardIndex = 0;

  guests.forEach((guest) => {
    if (cardIndex > 0 && cardIndex % (cols * rows) === 0) {
      doc.addPage();
    }

    const posInPage = cardIndex % (cols * rows);
    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    const x = margin + col * (cardW + gap);
    const y = margin + row * (cardH + gap);

    // Card border
    doc.setDrawColor(...style.borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2);

    // Fold line (dashed)
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(200, 200, 200);
    doc.line(x + 3, y + cardH / 2, x + cardW - 3, y + cardH / 2);
    doc.setLineDashPattern([], 0);

    // Guest name (centered on top half)
    const centerX = x + cardW / 2;
    const topCenterY = y + cardH / 4;

    doc.setFont('helvetica', style.nameFontStyle);
    doc.setFontSize(style.nameSize);
    doc.setTextColor(40, 40, 40);
    doc.text(`${guest.firstName} ${guest.lastName}`, centerX, topCenterY, { align: 'center' });

    // Subtitle line(s)
    let subY = topCenterY + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(style.subSize);
    doc.setTextColor(120, 120, 120);

    const subParts = [];
    if (showTable && guest.tableName) subParts.push(`Table: ${guest.tableName}`);
    if (showDietary && guest.dietary && guest.dietary !== 'non-veg') {
      const labels = { vegetarian: 'Veg', vegan: 'Vegan', jain: 'Jain' };
      subParts.push(labels[guest.dietary] || guest.dietary);
    }
    if (showFamily && guest.familyName) subParts.push(guest.familyName);

    if (subParts.length > 0) {
      doc.text(subParts.join('  ·  '), centerX, subY, { align: 'center' });
    }

    // Bottom half — same name upside down (tent fold)
    doc.saveGraphicsState();
    const bottomCenterY = y + cardH * 0.75;
    doc.setFont('helvetica', style.nameFontStyle);
    doc.setFontSize(style.nameSize);
    doc.setTextColor(40, 40, 40);

    // Rotate 180° around the bottom-half center point
    const angle = 180;
    doc.text(`${guest.firstName} ${guest.lastName}`, centerX, bottomCenterY, {
      align: 'center',
      angle,
    });

    if (subParts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(style.subSize);
      doc.setTextColor(120, 120, 120);
      doc.text(subParts.join('  ·  '), centerX, bottomCenterY - 5, {
        align: 'center',
        angle,
      });
    }
    doc.restoreGraphicsState();

    cardIndex++;
  });

  return doc;
}

// ─── Table Assignment Sheet ─────────────────────────────────────────────────
// One page per table listing all guests

export function generateTableAssignmentPDF(tables, guests, options = {}) {
  const { eventName = '', showDietary = true } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;
  let pageNum = 1;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Table Assignments', margin, y);
  y += 5;

  if (eventName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(eventName, margin, y);
    y += 3;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;

  tables.forEach((table) => {
    const tableGuests = (table.assignedGuests || [])
      .map((id) => guests.find((g) => g.id === id))
      .filter(Boolean);

    const blockHeight = 12 + tableGuests.length * 6 + 5;

    // New page if needed
    if (y + blockHeight > 260) {
      doc.addPage();
      y = margin;
      pageNum++;
    }

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`${table.name}`, margin + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`${tableGuests.length}/${table.capacity} seats`, pageW - margin - 3, y + 5.5, { align: 'right' });
    y += 10;

    // Guest rows
    tableGuests.forEach((g, i) => {
      const rowY = y + i * 6;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}.  ${g.firstName} ${g.lastName}`, margin + 5, rowY + 3.5);

      if (g.familyName) {
        doc.setTextColor(150, 150, 150);
        doc.text(g.familyName, margin + 80, rowY + 3.5);
      }

      if (showDietary && g.dietary && g.dietary !== 'non-veg') {
        const labels = { vegetarian: 'V', vegan: 'VG', jain: 'J' };
        doc.setTextColor(180, 130, 80);
        doc.text(labels[g.dietary] || '', pageW - margin - 5, rowY + 3.5, { align: 'right' });
      }
    });

    y += tableGuests.length * 6 + 5;
  });

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, 275, { align: 'center' });
  }

  return doc;
}

// ─── Guest List PDF ─────────────────────────────────────────────────────────
// Full alphabetical guest list with RSVP status per event

export function generateGuestListPDF(guests, events, options = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Guest List', margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${guests.length} guests · ${events.length} events · ${new Date().toLocaleDateString()}`, margin, y + 10);
  y += 16;

  // Header row
  const colWidths = {
    num: 8,
    name: 45,
    family: 30,
    side: 15,
    dietary: 20,
    phone: 30,
  };
  const eventColW = Math.min(25, (pageW - margin * 2 - Object.values(colWidths).reduce((a, b) => a + b, 0)) / Math.max(events.length, 1));

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);

  let hx = margin + 2;
  doc.text('#', hx, y + 5); hx += colWidths.num;
  doc.text('Name', hx, y + 5); hx += colWidths.name;
  doc.text('Family', hx, y + 5); hx += colWidths.family;
  doc.text('Side', hx, y + 5); hx += colWidths.side;
  doc.text('Diet', hx, y + 5); hx += colWidths.dietary;
  doc.text('Phone', hx, y + 5); hx += colWidths.phone;
  events.forEach((evt) => {
    doc.text(evt.name.substring(0, 12), hx, y + 5);
    hx += eventColW;
  });
  y += 9;

  // Sort guests alphabetically
  const sorted = [...guests].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  sorted.forEach((g, i) => {
    if (y > pageH - 15) {
      doc.addPage();
      y = margin;
    }

    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, pageW - margin * 2, 5.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);

    let rx = margin + 2;
    doc.text(`${i + 1}`, rx, y + 3); rx += colWidths.num;
    doc.text(`${g.firstName} ${g.lastName}`, rx, y + 3); rx += colWidths.name;
    doc.text(g.familyName || '', rx, y + 3); rx += colWidths.family;
    doc.text(g.side === 'bride' ? 'B' : 'G', rx, y + 3); rx += colWidths.side;
    const dietLabels = { vegetarian: 'Veg', vegan: 'VG', jain: 'Jain', 'non-veg': 'NV' };
    doc.text(dietLabels[g.dietary] || '', rx, y + 3); rx += colWidths.dietary;
    doc.text(g.phone || '', rx, y + 3); rx += colWidths.phone;

    events.forEach((evt) => {
      const status = (g.rsvpStatus || {})[evt.id];
      if (status === 'accepted') { doc.setTextColor(34, 139, 34); doc.text('✓', rx + 4, y + 3); }
      else if (status === 'declined') { doc.setTextColor(200, 50, 50); doc.text('✗', rx + 4, y + 3); }
      else { doc.setTextColor(180, 180, 180); doc.text('—', rx + 4, y + 3); }
      doc.setTextColor(60, 60, 60);
      rx += eventColW;
    });

    y += 5.5;
  });

  return doc;
}
