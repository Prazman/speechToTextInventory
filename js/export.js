// export.js — CSV generation and download

function escapeCSV(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function generateCSV(rooms) {
  const rows = ['Room,Item,Category,Notes'];
  for (const room of rooms) {
    if (room.items.length === 0) {
      rows.push(`${escapeCSV(room.name)},,,`);
    } else {
      for (const item of room.items) {
        rows.push([
          escapeCSV(room.name),
          escapeCSV(item.item),
          escapeCSV(item.category),
          escapeCSV(item.notes),
        ].join(','));
      }
    }
  }
  return rows.join('\r\n');
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
