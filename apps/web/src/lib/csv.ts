/** Builds RFC-4180-ish CSV text. Every field is quoted; quotes are doubled. */
export function toCsv(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const line = (cells: readonly string[]) => cells.map(escape).join(',');
  return [line(headers), ...rows.map(line)].join('\r\n');
}

/** Triggers a browser download of the given CSV content. */
export function downloadCsv(filename: string, headers: readonly string[], rows: string[][]): void {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
