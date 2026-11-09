import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Erzeugt den Claude-Skill unter skill/webflow-library/ aus
 *   - skill-src/SKILL.template.md   (handgeschriebener Rahmen)
 *   - src/index.ts                  (welche Utilities registriert sind)
 *   - src/utilities/<name>/README.md (Referenz je Utility)
 *   - CHANGELOG.md                  (seit welcher Version es eine Utility gibt)
 *   - package.json                  (Version im Einbau-Snippet)
 *
 *   node scripts/skill.mjs           -> schreibt den Skill neu
 *   node scripts/skill.mjs --check   -> bricht ab, wenn der committete Skill nicht zum Quellstand passt
 */

const OUT = 'skill/webflow-library';
const DESCRIPTION_LIMIT = 1024;

const checkOnly = process.argv.includes('--check');
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const changelog = readFileSync('CHANGELOG.md', 'utf8');

function fail(message) {
  console.error(`skill: ${message}`);
  process.exit(1);
}

function registeredUtilities() {
  const index = readFileSync('src/index.ts', 'utf8');
  const names = [...index.matchAll(/from '\.\/utilities\/([a-z]+)'/g)].map((m) => m[1]);
  if (names.length === 0) fail('keine Utility-Imports in src/index.ts gefunden.');
  return names.sort();
}

/** Erster Absatz nach der H1, Zeilen zusammengezogen. */
function summaryOf(readme, name) {
  const lines = readme.split('\n');
  const h1 = lines.findIndex((line) => line.startsWith('# '));
  if (h1 === -1) fail(`src/utilities/${name}/README.md hat keine Überschrift "# ${name}".`);
  const paragraph = [];
  for (const line of lines.slice(h1 + 1)) {
    if (line.trim() === '') {
      if (paragraph.length) break;
      continue;
    }
    if (line.startsWith('#')) break;
    paragraph.push(line.trim());
  }
  if (!paragraph.length) fail(`src/utilities/${name}/README.md hat keinen Einleitungssatz.`);
  return paragraph.join(' ');
}

function firstSentence(text) {
  // Satzende ist ein Punkt nach einem Wort (nicht "z. B."), ein Doppelpunkt oder ein Gedankenstrich.
  const match = text.match(/^.*?(?:[a-zäöüß]{2}\.(?=\s|$)|:(?=\s|$)| — )/);
  return (match ? match[0] : text).trim().replace(/\s*(—|[.:])$/, '');
}

/** Erster ```html-Block im Abschnitt "## Beispiel". */
function exampleOf(readme, name) {
  const section = readme.split(/^## /m).find((part) => part.startsWith('Beispiel'));
  const block = section?.match(/```html\n([\s\S]*?)```/);
  if (!block) fail(`src/utilities/${name}/README.md braucht im Abschnitt "## Beispiel" einen \`\`\`html-Block.`);
  return block[1].trimEnd();
}

/** Älteste Changelog-Version, deren Abschnitt die Utility nennt. */
function sinceOf(name) {
  const sections = changelog.split(/^## /m).slice(1);
  let since = null;
  for (const section of sections) {
    const v = section.match(/^(\d+\.\d+\.\d+)/)?.[1];
    if (v && section.includes(`\`${name}\``)) since = v; // Changelog ist absteigend, der letzte Treffer ist der älteste
  }
  return since ?? 'unveröffentlicht';
}

function build() {
  const utilities = registeredUtilities().map((name) => {
    const readme = readFileSync(`src/utilities/${name}/README.md`, 'utf8');
    return { name, readme, summary: summaryOf(readme, name), example: exampleOf(readme, name), since: sinceOf(name) };
  });

  const description =
    'Wissen über Marius\' eigene webflow-library (mschmid03/webflow-library): Script wl.min.js, Custom Attributes mit ' +
    'Prefix wl- für veröffentlichte Webflow-Seiten. Utilities: ' +
    utilities.map((u) => `${u.name} (${firstSentence(u.summary)})`).join('; ') +
    '. Nutze diesen Skill immer, wenn in einem Webflow-Projekt wl-Attribute gesetzt, geprüft oder debuggt werden, ' +
    'das wl.min.js-Script eingebunden oder auf eine neue Version gehoben wird, Attribute wie wl-error oder wl-init ' +
    'auftauchen, oder wenn jemand ein solches Verhalten ohne eigenes JavaScript umsetzen will oder fragt, ob die ' +
    'Library etwas kann, auch wenn sie nicht beim Namen genannt wird.';

  if (description.length > DESCRIPTION_LIMIT) {
    fail(
      `description ist ${description.length} Zeichen lang, erlaubt sind ${DESCRIPTION_LIMIT}. ` +
        'Einleitungssätze der Utility-READMEs kürzen oder den Rahmen in scripts/skill.mjs straffen.',
    );
  }

  const table = [
    '| Utility | seit | Zweck | Referenz |',
    '|---|---|---|---|',
    ...utilities.map(
      (u) => `| \`${u.name}\` | ${u.since} | ${firstSentence(u.summary)} | [references/${u.name}.md](references/${u.name}.md) |`,
    ),
  ];
  const sections = utilities.map((u) =>
    [`### \`${u.name}\``, '', u.summary, '', '```html', u.example, '```'].join('\n'),
  );

  const template = readFileSync('skill-src/SKILL.template.md', 'utf8');
  const skill = template
    .replaceAll('{{description}}', JSON.stringify(description))
    .replaceAll('{{version}}', version)
    .replaceAll('{{utilities}}', [table.join('\n'), ...sections].join('\n\n'));

  const unresolved = skill.match(/\{\{[a-z]+\}\}/);
  if (unresolved) fail(`Platzhalter ${unresolved[0]} im Template ist unbekannt.`);

  const files = new Map([['SKILL.md', skill]]);
  for (const u of utilities) {
    const note = `<!-- Kopie von src/utilities/${u.name}/README.md, generiert von scripts/skill.mjs. Nicht hier editieren. -->\n\n`;
    files.set(`references/${u.name}.md`, note + u.readme);
  }
  return files;
}

function listFiles(dir, prefix = '') {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  );
}

const files = build();

if (checkOnly) {
  const stale = [];
  for (const [path, content] of files) {
    let current = null;
    try {
      current = readFileSync(join(OUT, path), 'utf8');
    } catch {}
    if (current !== content) stale.push(path);
  }
  for (const path of listFiles(OUT)) if (!files.has(path)) stale.push(`${path} (überzählig)`);
  if (stale.length) {
    fail(`${OUT} passt nicht zum Quellstand (${stale.join(', ')}). "pnpm skill" ausführen und das Ergebnis committen.`);
  }
  console.log(`skill: ${OUT} ist aktuell (${version}).`);
} else {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, content] of files) {
    mkdirSync(join(OUT, path, '..'), { recursive: true });
    writeFileSync(join(OUT, path), content);
  }
  console.log(`skill: ${OUT} neu erzeugt (${version}, ${files.size - 1} Utilities).`);
}
