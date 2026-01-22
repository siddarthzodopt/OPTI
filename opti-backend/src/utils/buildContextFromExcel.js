const buildContextFromExcel = (excelJson, limit = 30) => {
  if (!excelJson || excelJson.length === 0) return "No lead data found in Excel.";

  const sample = excelJson.slice(0, limit);

  // Turn JSON rows into readable text
  const lines = sample.map((row, idx) => {
    const entries = Object.entries(row)
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    return `${idx + 1}. ${entries}`;
  });

  return `Leads data (showing ${sample.length} records):\n` + lines.join("\n");
};

module.exports = { buildContextFromExcel };
