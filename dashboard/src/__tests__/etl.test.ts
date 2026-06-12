/**
 * Unit tests for ETL pure functions used in /api/upload.
 * @jest-environment node
 */
import { canonicalize, parseNumeric, parseYear, parseDateIso } from '@/lib/etl';

// ── canonicalize ──────────────────────────────────────────────────────────────

test('canonicalize trims and title-cases', () => {
  expect(canonicalize('  holistic care  ')).toBe('Holistic Care');
});

test('canonicalize collapses multiple spaces', () => {
  expect(canonicalize('infant  goodie   bag')).toBe('Infant Goodie Bag');
});

test('canonicalize returns null for empty string', () => {
  expect(canonicalize('')).toBeNull();
  expect(canonicalize(null)).toBeNull();
});

// ── parseNumeric ──────────────────────────────────────────────────────────────

test('parseNumeric parses plain integers', () => {
  expect(parseNumeric('100')).toBe(100);
});

test('parseNumeric parses numbers with commas', () => {
  expect(parseNumeric('1,234')).toBe(1234);
});

test('parseNumeric returns null for "Multiple"', () => {
  expect(parseNumeric('Multiple')).toBeNull();
  expect(parseNumeric('multiple')).toBeNull();
  expect(parseNumeric('MULTIPLE')).toBeNull();
});

test('parseNumeric returns null for "NA"', () => {
  expect(parseNumeric('NA')).toBeNull();
  expect(parseNumeric('na')).toBeNull();
  expect(parseNumeric(' NA ')).toBeNull();
});

test('parseNumeric returns null for non-numeric strings', () => {
  expect(parseNumeric('abc')).toBeNull();
  expect(parseNumeric('')).toBeNull();
  expect(parseNumeric(null)).toBeNull();
});

// ── parseYear ─────────────────────────────────────────────────────────────────

test('parseYear handles fiscal year range like "2016-17"', () => {
  const r = parseYear('2016-17');
  expect(r.year_start).toBe(2016);
  expect(r.year_end).toBe(2017);
  expect(r.year_label).toBe('2016-2017');
});

test('parseYear handles full range like "2019-2020"', () => {
  const r = parseYear('2019-2020');
  expect(r.year_start).toBe(2019);
  expect(r.year_end).toBe(2020);
  expect(r.year_label).toBe('2019-2020');
});

test('parseYear handles single year like "2019"', () => {
  const r = parseYear('2019');
  expect(r.year_start).toBe(2019);
  expect(r.year_end).toBe(2019);
  expect(r.year_label).toBe('2019');
});

test('parseYear returns nulls for null input', () => {
  const r = parseYear(null);
  expect(r.year_start).toBeNull();
  expect(r.year_end).toBeNull();
});

// ── parseDateIso ──────────────────────────────────────────────────────────────

test('parseDateIso parses DD/MM/YYYY', () => {
  expect(parseDateIso('15/03/2022')).toBe('2022-03-15');
});

test('parseDateIso parses YYYY-MM-DD', () => {
  expect(parseDateIso('2022-03-15')).toBe('2022-03-15');
});

test('parseDateIso parses Excel serial number', () => {
  // Excel serial 44635 = 2022-03-15 (1900 epoch)
  expect(parseDateIso(44635)).toBe('2022-03-15');
});

test('parseDateIso returns null for unparseable input', () => {
  expect(parseDateIso('not a date')).toBeNull();
  expect(parseDateIso(null)).toBeNull();
});
