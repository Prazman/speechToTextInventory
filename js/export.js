// export.js — CSV generation and download

function escapeCSV(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function generateCSV(rooms) {
  const rows = ['Room,Item,Quantity,Category,Notes'];
  for (const room of rooms) {
    if (room.items.length === 0) {
      rows.push(`${escapeCSV(room.name)},,,,`);
    } else {
      for (const item of room.items) {
        rows.push([
          escapeCSV(room.name),
          escapeCSV(item.item),
          escapeCSV(item.quantity ?? 1),
          escapeCSV(item.category),
          escapeCSV(item.notes),
        ].join(','));
      }
    }
  }
  return rows.join('\r\n');
}

// --- CSV Import ---

function parseCSVRow(row) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(csvString) {
  // Strip BOM
  const text = csvString.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return [];

  const header = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  const hasQuantity = header.includes('quantity');

  const roomMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    const roomName = fields[0]?.trim();
    if (!roomName) continue;

    let item, quantity, category, notes;
    if (hasQuantity) {
      item = fields[1]?.trim() || '';
      quantity = parseInt(fields[2], 10) || 1;
      category = fields[3]?.trim() || '';
      notes = fields[4]?.trim() || '';
    } else {
      item = fields[1]?.trim() || '';
      quantity = 1;
      category = fields[2]?.trim() || '';
      notes = fields[3]?.trim() || '';
    }

    if (!roomMap.has(roomName)) {
      roomMap.set(roomName, []);
    }
    if (item) {
      roomMap.get(roomName).push({ item, quantity, category, notes });
    }
  }

  return Array.from(roomMap.entries()).map(([name, items]) => ({ name, items }));
}

export function downloadCSV(csvString, filename) {
  if (!filename) {
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    filename = `inventory-${date}.csv`;
  }
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
