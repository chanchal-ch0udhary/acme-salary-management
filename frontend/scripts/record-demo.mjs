/**
 * Records a captioned walkthrough of the running app to demo/salary-management-demo.webm.
 *
 *   bin/rails server                                   # terminal 1 (http://localhost:3000, after npm run build)
 *   cd frontend && npm run demo                            # terminal 2
 *
 * Uses the locally installed Edge/Chrome via playwright-core (no browser download).
 * Env: BASE_URL (default http://127.0.0.1:3000), BROWSER_CHANNEL (default msedge; use "chrome" if preferred).
 */
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const CHANNEL = process.env.BROWSER_CHANNEL ?? 'msedge';
const OUT_DIR = new URL('../../demo/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT_DIR, { recursive: true });
const tmp = `${OUT_DIR}tmp-video`;
rmSync(tmp, { recursive: true, force: true });

const browser = await chromium.launch({ channel: CHANNEL, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: tmp, size: { width: 1280, height: 720 } } });
const page = await context.newPage();

// Persistent caption bar that survives SPA navigation (re-created on full page loads).
await page.addInitScript(() => {
  const ensure = () => {
    if (document.getElementById('demo-caption')) return;
    const el = document.createElement('div');
    el.id = 'demo-caption';
    Object.assign(el.style, { position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '99999', padding: '14px 28px', font: '600 20px system-ui, sans-serif', color: '#fff', background: 'rgba(15,23,42,.92)', textAlign: 'center', pointerEvents: 'none' });
    document.documentElement.appendChild(el);
  };
  window.__caption = (t) => { ensure(); document.getElementById('demo-caption').textContent = t; };
});
const say = async (text, ms = 2500) => { await page.evaluate((t) => window.__caption?.(t), text); await pause(ms); };

// Pick a deterministic employee to demo salary change on.
const sample = await (await fetch(`${BASE}/api/employees?q=EMP-00042`)).json();
const target = sample.items[0];

// 1. Insights
await page.goto(BASE);
await page.waitForSelector('text=Active headcount');
await say('ACME HR answers "how do we pay people?" from one dashboard: 10,000 employees, 12 countries.', 4000);
await page.getByRole('button', { name: 'Department' }).first().click();
await say('Pay by department, with min / P25 / median / P75 / max — no pivot tables.', 3500);
await page.getByRole('button', { name: 'Level' }).first().click();
await say('…or by level, job title or gender. All figures normalised to USD.', 3000);
await page.getByRole('button', { name: 'Overall' }).click();
await say('Gender pay gap, overall and by level — hidden where samples are too small to mean anything.', 4000);
await page.getByRole('button', { name: 'By level' }).click();
await pause(1500);

// 2. Employees list
await page.getByRole('link', { name: 'Employees' }).click();
await page.getByPlaceholder('Search name, email or code').waitFor();
await say('Employees: server-side search, filters, sorting and pagination — fast on 10,000 rows.', 3500);
await page.getByPlaceholder('Search name, email or code').fill('Priya');
await pause(1500);
await say('Search as you type (debounced). The URL holds the filters, so any view is shareable.', 3500);
await page.getByPlaceholder('Search name, email or code').fill('');
await page.getByLabel('Country').first().click();
await page.getByRole('option', { name: 'Germany' }).click();
await pause(1200);
await page.getByRole('columnheader', { name: /Salary \(local\)/ }).getByText('Salary (local)').click();
await pause(800);
await page.getByRole('columnheader', { name: /Salary \(local\)/ }).getByText('Salary (local)').click();
await say('Filter by country and sort by salary — descending, in local currency with a USD equivalent.', 3500);
await page.getByRole('button', { name: 'Clear' }).click();

// 3. Salary change + audit
await page.goto(`${BASE}/employees/${target.id}`);
await page.waitForSelector('text=Salary history');
await say(`${target.full_name}: profile, current salary and the full salary history.`, 3500);
await page.getByRole('button', { name: 'Change salary' }).click();
const raise = Math.round((target.salary * 1.08) / 1000) * 1000;
await page.getByLabel(/New annual salary/).fill(String(raise));
await pause(800);
await page.getByLabel('Reason').fill('Annual review');
await say('Salary changes always need an effective date and a reason — and show the % change live.', 3800);
await page.getByRole('button', { name: 'Save change' }).click();
await page.waitForSelector('text=Annual review');
await say('Saved atomically: the record and its audit trail can never disagree.', 3800);

// 4. Add employee
await page.getByRole('link', { name: 'All employees' }).click();
await page.getByRole('button', { name: 'Add employee' }).click();
await page.getByLabel('Full name').fill('Demo Candidate');
await page.getByLabel('Email').fill(`demo.candidate.${Date.now()}@acme.example`);
await page.getByLabel('Job title').fill('Software Engineer');
await page.getByLabel('Annual salary').fill('95000');
await say('Adding an employee: validated on both client and server; currency is derived from the country.', 3800);
await page.getByRole('button', { name: 'Add employee' }).last().click();
await page.waitForSelector('text=Initial salary');
await say('Created — with its opening salary-history entry.', 3000);

// 5. Import / export
await page.getByRole('link', { name: 'All employees' }).click();
await page.getByRole('button', { name: 'Import CSV' }).click();
await say('Migrating from Excel? Import a CSV: valid rows load, bad rows come back with row-level errors.', 4200);
await page.getByRole('button', { name: 'Close' }).click();
await say('Export respects the current filters, and neutralises spreadsheet formula injection.', 3500);

// 6. Finish on the dashboard (numbers updated by the writes above)
await page.getByRole('link', { name: 'Insights' }).click();
await say('Every write refreshes the lists and the insights. Thanks for watching!', 3500);

await context.close(); // flushes the video
await browser.close();

const file = readdirSync(tmp).find((f) => f.endsWith('.webm'));
renameSync(`${tmp}/${file}`, `${OUT_DIR}salary-management-demo.webm`);
rmSync(tmp, { recursive: true, force: true });
console.log(`Saved ${OUT_DIR}salary-management-demo.webm`);
