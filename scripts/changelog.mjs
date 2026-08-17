import { readFileSync } from 'node:fs';

/**
 * Prüft und liest den Changelog-Abschnitt der Version aus package.json.
 *   node scripts/changelog.mjs           -> prüft nur, bricht bei Problemen ab
 *   node scripts/changelog.mjs --notes   -> gibt den Abschnitt auf stdout aus
 * Wird sowohl im version-Hook als auch im Release-Workflow benutzt, damit beide dieselbe Regel anwenden.
 */

const wantsNotes = process.argv.includes('--notes');
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const lines = readFileSync('CHANGELOG.md', 'utf8').split('\n');

function fail(message, hint) {
  console.error(`CHANGELOG.md: ${message}`);
  if (hint) console.error(hint);
  process.exit(1);
}

const heading = new RegExp(`^## ${version.replace(/\./g, '\\.')}(\\s|$)`);
const start = lines.findIndex((line) => heading.test(line));

if (start === -1) {
  fail(
    `kein Abschnitt für Version ${version} gefunden.`,
    `Erwartet wird eine Überschrift "## ${version} — ${new Date().toISOString().slice(0, 10)}".\n` +
      'Wenn pnpm version das gemeldet hat: Abschnitt ergänzen, "git checkout package.json", dann erneut releasen.',
  );
}

const headingLine = lines[start];
if (!/\d{4}-\d{2}-\d{2}/.test(headingLine)) {
  fail(`Abschnitt "${headingLine}" hat kein Datum im Format YYYY-MM-DD.`);
}

const rest = lines.slice(start + 1);
const end = rest.findIndex((line) => line.startsWith('## '));
const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();

if (body === '') {
  fail(`Abschnitt für Version ${version} ist leer.`);
}

if (wantsNotes) console.log(body);
else console.log(`CHANGELOG.md: Abschnitt für ${version} ist vollständig.`);
