/**
 * Minimal CSV generator with correct RFC 4180 escaping — any field
 * containing a comma, quote, or newline gets quoted, with internal
 * quotes doubled. Good enough for Excel/Sheets/accounting software,
 * without pulling in a dependency for something this small.
 */
export function toCsv(rows: Record<string, string | number | null>[], columns: { key: string; label: string }[]): string {
  const escape = (val: string | number | null) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  return [header, ...lines].join("\r\n");
}
