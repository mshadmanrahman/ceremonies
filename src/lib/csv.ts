/**
 * Client-side CSV generation and download utility.
 * No dependencies. Handles proper escaping of fields containing
 * commas, quotes, or newlines per RFC 4180.
 */

function escapeField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCSV(fields: ReadonlyArray<string>): string {
  return fields.map(escapeField).join(",");
}

export function generateCSV(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string>>
): string {
  const lines = [rowToCSV(headers), ...rows.map(rowToCSV)];
  return lines.join("\n");
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
