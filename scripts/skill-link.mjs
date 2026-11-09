import { lstatSync, mkdirSync, readlinkSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Verlinkt skill/webflow-library nach ~/.claude/skills/webflow-library, damit Claude Code den Skill
 * in allen Projekten findet. Der Link zeigt auf das Repo, jede Aktualisierung hier ist sofort aktiv.
 */

const target = resolve('skill/webflow-library');
const skillsDir = join(homedir(), '.claude', 'skills');
const link = join(skillsDir, 'webflow-library');

let existing = null;
try {
  existing = lstatSync(link);
} catch {}

if (existing?.isSymbolicLink() && resolve(skillsDir, readlinkSync(link)) === target) {
  console.log(`skill:link: ${link} zeigt bereits auf ${target}.`);
} else if (existing) {
  console.error(`skill:link: ${link} existiert schon und ist kein Link auf dieses Repo. Bitte prüfen und von Hand entfernen.`);
  process.exit(1);
} else {
  mkdirSync(skillsDir, { recursive: true });
  symlinkSync(target, link, 'dir');
  console.log(`skill:link: ${link} -> ${target}`);
}
