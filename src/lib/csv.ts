function csvCell(value: string | number) {
  const text = String(value ?? "");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"', '""')}"`;
}

export function toCsv(headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}
