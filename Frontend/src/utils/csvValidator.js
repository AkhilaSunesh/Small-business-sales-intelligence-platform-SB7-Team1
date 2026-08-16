// Simple CSV validator and parser utilities

// Parse CSV into array of objects (assumes first row is header)
export function parseCSV(text, maxRows = Infinity) {
  if (!text) return { headers: [], rows: [] };

  // Split lines honoring quoted fields
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headerLine = lines[0];
  const headers = splitCSVLine(headerLine).map((h) => h.trim());

  const rows = [];
  for (let i = 1; i < Math.min(lines.length, 1 + maxRows); i += 1) {
    const values = splitCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });
    rows.push(obj);
  }

  return { headers, rows };
}

// Very small CSV line splitter that handles simple quoted fields
function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function validateCSVHeaders(headers, required = ['CustomerID', 'ProductID', 'Quantity', 'Price', 'TransactionDate']) {
  const missing = [];
  const lower = headers.map((h) => h.toLowerCase());
  required.forEach((r) => {
    if (!lower.includes(r.toLowerCase())) missing.push(r);
  });
  return missing;
}
