/**
 * Unit tests for data cleaning utilities
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { canonicalizeText, parseYear, parseDate, parseNumeric, cleanRow } from './utils.js';

// Test canonicalizeText
test('canonicalizeText - trims and converts to Title Case', () => {
  assert.strictEqual(canonicalizeText('  hello world  '), 'Hello World');
  assert.strictEqual(canonicalizeText('HELLO   WORLD'), 'Hello World');
  assert.strictEqual(canonicalizeText('hello'), 'Hello');
  assert.strictEqual(canonicalizeText(''), null);
  assert.strictEqual(canonicalizeText(null), null);
  assert.strictEqual(canonicalizeText(undefined), null);
});

// Test parseYear
test('parseYear - handles year ranges (2016-17 format)', () => {
  const result = parseYear('2016-17');
  assert.strictEqual(result.year_start, 2016);
  assert.strictEqual(result.year_end, 2017);
  assert.strictEqual(result.year_label, '2016-2017');
});

test('parseYear - handles year ranges (2016-2017 format)', () => {
  const result = parseYear('2016-2017');
  assert.strictEqual(result.year_start, 2016);
  assert.strictEqual(result.year_end, 2017);
  assert.strictEqual(result.year_label, '2016-2017');
});

test('parseYear - handles single year', () => {
  const result = parseYear('2019');
  assert.strictEqual(result.year_start, 2019);
  assert.strictEqual(result.year_end, 2019);
  assert.strictEqual(result.year_label, '2019');
});

test('parseYear - handles century rollover', () => {
  const result = parseYear('1999-00');
  assert.strictEqual(result.year_start, 1999);
  assert.strictEqual(result.year_end, 2000);
});

test('parseYear - handles invalid input', () => {
  const result = parseYear('invalid');
  assert.strictEqual(result.year_start, null);
  assert.strictEqual(result.year_end, null);
  assert.strictEqual(result.year_label, 'invalid');
});

test('parseYear - handles null/empty', () => {
  const result = parseYear(null);
  assert.strictEqual(result.year_start, null);
  assert.strictEqual(result.year_end, null);
  assert.strictEqual(result.year_label, null);
});

// Test parseDate
test('parseDate - handles ISO format', () => {
  assert.strictEqual(parseDate('2023-12-25'), '2023-12-25');
});

test('parseDate - handles DD/MM/YYYY format', () => {
  assert.strictEqual(parseDate('25/12/2023'), '2023-12-25');
});

test('parseDate - handles Date objects', () => {
  const date = new Date('2023-12-25');
  assert.strictEqual(parseDate(date), '2023-12-25');
});

test('parseDate - handles null/empty', () => {
  assert.strictEqual(parseDate(null), null);
  assert.strictEqual(parseDate(''), null);
});

test('parseDate - handles invalid dates', () => {
  assert.strictEqual(parseDate('invalid'), null);
  assert.strictEqual(parseDate('99/99/9999'), null);
});

// Test parseNumeric
test('parseNumeric - parses valid numbers', () => {
  assert.strictEqual(parseNumeric('100'), 100);
  assert.strictEqual(parseNumeric('100.50'), 100.5);
  assert.strictEqual(parseNumeric(100), 100);
});

test('parseNumeric - handles "Multiple" as null', () => {
  assert.strictEqual(parseNumeric('Multiple'), null);
  assert.strictEqual(parseNumeric('MULTIPLE'), null);
  assert.strictEqual(parseNumeric('  multiple  '), null);
});

test('parseNumeric - handles "NA" as null', () => {
  assert.strictEqual(parseNumeric('NA'), null);
  assert.strictEqual(parseNumeric('N/A'), null);
  assert.strictEqual(parseNumeric('na'), null);
});

test('parseNumeric - removes formatting', () => {
  assert.strictEqual(parseNumeric('1,000'), 1000);
  assert.strictEqual(parseNumeric('₹1,000'), 1000);
  assert.strictEqual(parseNumeric('$100.50'), 100.5);
});

test('parseNumeric - handles null/empty', () => {
  assert.strictEqual(parseNumeric(null), null);
  assert.strictEqual(parseNumeric(''), null);
  assert.strictEqual(parseNumeric(undefined), null);
});

test('parseNumeric - handles invalid numbers', () => {
  assert.strictEqual(parseNumeric('abc'), null);
  assert.strictEqual(parseNumeric('12abc'), null);
});

// Test cleanRow integration
test('cleanRow - processes complete row', () => {
  const rawRow = {
    'Sr.No': 1,
    'Year': '2016-17',
    'Date': '2016-05-15',
    'Project': '  HEALTH  ',
    'Sub Project': 'infant goodie bag',
    'Institute': 'Test Hospital',
    'Type of Institution': 'hospital',
    'Quantity': '100',
    'No. of Beneficiaries': '50',
    'Amount': '10,000',
    'Remarks': 'Test remarks'
  };

  const cleaned = cleanRow(rawRow);

  // Check originals are preserved
  assert.strictEqual(cleaned.project, '  HEALTH  ');
  assert.strictEqual(cleaned.quantity, '100');

  // Check canonicals are cleaned
  assert.strictEqual(cleaned.project_canon, 'Health');
  assert.strictEqual(cleaned.sub_project_canon, 'Infant Goodie Bag');

  // Check year parsing
  assert.strictEqual(cleaned.year_start, 2016);
  assert.strictEqual(cleaned.year_end, 2017);

  // Check date parsing
  assert.strictEqual(cleaned.date_iso, '2016-05-15');

  // Check numeric parsing
  assert.strictEqual(cleaned.quantity_num, 100);
  assert.strictEqual(cleaned.no_of_beneficiaries_num, 50);
  assert.strictEqual(cleaned.amount_num, 10000);

  // Check hash is generated
  assert.ok(cleaned.row_hash);
  assert.strictEqual(typeof cleaned.row_hash, 'string');
});

test('cleanRow - handles Multiple/NA values', () => {
  const rawRow = {
    'Sr.No': 1,
    'Year': '2023',
    'Project': 'Test',
    'Quantity': 'Multiple',
    'No. of Beneficiaries': 'NA',
    'Amount': '5000'
  };

  const cleaned = cleanRow(rawRow);

  assert.strictEqual(cleaned.quantity_num, null);
  assert.strictEqual(cleaned.no_of_beneficiaries_num, null);
  assert.strictEqual(cleaned.amount_num, 5000);
});

console.log('✅ All tests completed');
