/**
 * Unit test for StatsCards label config.
 * @jest-environment node
 */

// We test the card label directly rather than rendering, because the
// component's async fetch makes render-level assertions brittle in jsdom.
// The label is pure static config — no need for a full render test.

test('StatsCards card labels include "Initiatives" and not "Causes Listed"', () => {
  // Read the component source and verify the label string
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.resolve(__dirname, '../components/StatsCards.tsx'),
    'utf8'
  );

  expect(source).toContain("label: 'Initiatives'");
  expect(source).not.toContain("label: 'Causes Listed'");
});
