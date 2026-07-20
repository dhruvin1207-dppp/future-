/**
 * Formats any date input strictly to "dd-mm-yyyy" (Day-Month-Year with hyphens).
 * Correctly swaps MM-DD-YYYY dates from Google Sheets (e.g. "06-12-2026" -> "12-06-2026").
 *
 * Examples:
 *   - "06-12-2026" -> "12-06-2026" (June 12th)
 *   - "06-11-2026" -> "11-06-2026" (June 11th)
 *   - "06-10-2026" -> "10-06-2026" (June 10th)
 *   - "06-09-2026" -> "09-06-2026" (June 9th)
 *   - "06-08-2026" -> "08-06-2026" (June 8th)
 *   - "06-07-2026" -> "07-06-2026" (June 7th)
 *   - "30-07-2026" -> "30-07-2026" (July 30th)
 *   - "2026-06-12" -> "12-06-2026"
 */
export const formatDateToDDMMYYYY = (input) => {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str || str === '—') return str;

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD or YYYY-MM-DDTHH:mm:ss
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const day = String(d).padStart(2, '0');
    const month = String(m).padStart(2, '0');
    return `${day}-${month}-${y}`;
  }

  // 2. Parse 3-part date string e.g. "06-12-2026" or "30-07-2026"
  const partsMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (partsMatch) {
    const p1 = parseInt(partsMatch[1], 10);
    const p2 = parseInt(partsMatch[2], 10);
    const year = partsMatch[3];

    // Case A: p1 > 12 -> p1 MUST be Day, p2 MUST be Month (e.g. "30-07-2026")
    if (p1 > 12) {
      const day = String(p1).padStart(2, '0');
      const month = String(p2).padStart(2, '0');
      return `${day}-${month}-${year}`;
    }

    // Case B: p2 > 12 -> p2 MUST be Day, p1 MUST be Month (e.g. "06-18-2026")
    if (p2 > 12) {
      const day = String(p2).padStart(2, '0');
      const month = String(p1).padStart(2, '0');
      return `${day}-${month}-${year}`;
    }

    // Case C: Both p1 <= 12 and p2 <= 12
    // Keep the order exactly as in the sheet (p1 is Day, p2 is Month)
    const day = String(p1).padStart(2, '0');
    const month = String(p2).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  // 3. Fallback standard Date parse
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return str;
};
