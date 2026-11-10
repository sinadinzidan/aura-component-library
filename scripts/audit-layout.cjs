// Layout audit for the catalog: finds specimens that are cut off, overflow their frame, crash, or
// log errors. Needs the dev server (npm run dev) and Playwright available to Node.
//
//   node scripts/audit-layout.cjs                    # every built page, light
//   node scripts/audit-layout.cjs button card        # only these pages
//   node scripts/audit-layout.cjs --dark             # dark mode
//   node scripts/audit-layout.cjs --theme control-room --width 1280
//
// Exit code 1 when anything is found. Findings per specimen:
//   crashed      the specimen threw and the error boundary rendered
//   overflow-x   content is wider than its preview frame (it scrolls instead of fitting)
//   clipped      an element's content is cut by `overflow: hidden` without an ellipsis
//   squeezed     an ellipsis hides more than half of a label
//   offscreen    an element sticks out of the specimen card
//   tiny-text    text rendered under 10px
const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require('playwright');

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const valueFlags = new Set(['theme', 'width', 'out']);
const pagesArg = args.filter((arg, index) => !arg.startsWith('--') && !valueFlags.has((args[index - 1] ?? '').slice(2)));
const dark = args.includes('--dark');
const width = Number(flag('width') ?? 1440);
const presetId = flag('theme');
const base = process.env.CATALOG_URL ?? 'https://localhost:3001/';
const root = path.resolve(__dirname, '..');

function builtPages() {
  const dir = path.join(root, 'src/catalog/pages');
  return fs
    .readdirSync(dir)
    .flatMap((area) => fs.readdirSync(path.join(dir, area)))
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
    .map((file) => file.replace(/\.tsx$/, ''))
    .sort();
}

function presetSettings(id) {
  const source = fs.readFileSync(path.join(root, 'src/library/themes/themes.ts'), 'utf8');
  const match = new RegExp(`preset\\('${id}',[^{]*(\\{[^}]*\\})`).exec(source);
  if (!match) throw new Error(`Unknown theme preset: ${id}`);
  return Function(`return (${match[1]})`)();
}

async function auditPage(page, pageId, theme) {
  const errors = [];
  const onError = (error) => errors.push(String(error).slice(0, 200));
  const onConsole = (message) => {
    // Aura's own date and time pickers render their trigger as a div; that warning is upstream.
    if (message.type() === 'error' && !message.text().includes('acts as a button expected a native <button>')) {
      errors.push(message.text().slice(0, 200));
    }
  };
  page.on('pageerror', onError);
  page.on('console', onConsole);
  await page.goto(`${base}?state=${encodeURIComponent(JSON.stringify({ page: pageId, theme }))}`);
  await page.waitForSelector('[data-specimen]', { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(900);

  const findings = await page.evaluate(() => {
    const results = [];
    const describe = (element) => {
      const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const cls = (element.getAttribute('class') ?? '').split(/\s+/).slice(0, 3).join('.');
      return `<${element.tagName.toLowerCase()}${cls ? `.${cls}` : ''}> "${text}"`;
    };
    for (const card of document.querySelectorAll('[data-specimen]')) {
      const id = card.getAttribute('data-specimen');
      const add = (kind, detail) => results.push({ specimen: id, kind, detail });
      if ([...card.querySelectorAll('[role="alert"]')].some((node) => node.textContent.includes('This variant failed to render'))) {
        add('crashed', '');
        continue;
      }
      const preview = card.querySelector('[data-specimen-preview]');
      if (!preview) continue;
      if (preview.scrollWidth > preview.clientWidth + 1) {
        add('overflow-x', `${preview.scrollWidth}px content in ${preview.clientWidth}px frame`);
      }
      const cardBox = card.getBoundingClientRect();
      const seen = new Set();
      for (const element of preview.querySelectorAll('*')) {
        if (element.closest('svg') && element.tagName.toLowerCase() !== 'svg') continue;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
        const box = element.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;

        // Deliberately scrollable or ellipsised content is fine; silent clipping is not.
        const hidesX = style.overflowX === 'hidden' || style.overflowX === 'clip';
        const hidesY = style.overflowY === 'hidden' || style.overflowY === 'clip';
        const ellipsis = style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none';
        const srOnly = box.width <= 1 && box.height <= 1;
        if (!srOnly && !ellipsis && element.children.length === 0 && (element.textContent ?? '').trim()) {
          if ((hidesX && element.scrollWidth > element.clientWidth + 3) || (hidesY && element.scrollHeight > element.clientHeight + 6)) {
            const key = `clipped:${describe(element)}`;
            if (!seen.has(key)) {
              seen.add(key);
              add('clipped', describe(element));
            }
          }
        }
        // An ellipsis that hides more than half of a label usually means the layout is too tight.
        // Specimens whose point is truncation say so in their id (…LongLabels, …Truncated).
        const truncationDemo = /Long|Truncat|Overflow|Ellipsis|Collaps/i.test(id ?? '');
        if (!srOnly && !truncationDemo && ellipsis && style.webkitLineClamp === 'none' && element.children.length === 0 && element.clientWidth > 0) {
          if (element.scrollWidth > element.clientWidth * 2) {
            const key = `squeezed:${describe(element)}`;
            if (!seen.has(key)) {
              seen.add(key);
              add('squeezed', `${element.clientWidth}px of ${element.scrollWidth}px ${describe(element)}`);
            }
          }
        }
        if (!srOnly && (box.right > cardBox.right + 1 || box.left < cardBox.left - 1) && !element.closest('[data-specimen-preview] [style*="overflow"], .overflow-x-auto, .overflow-auto, [data-slot="scroll-area"]')) {
          // Only report the outermost offender.
          if (![...seen].some((key) => key.startsWith('offscreen'))) {
            seen.add('offscreen');
            add('offscreen', describe(element));
          }
        }
        if (element.children.length === 0 && (element.textContent ?? '').trim() && parseFloat(style.fontSize) < 10 && !element.closest('svg, .katex')) {
          if (!seen.has('tiny')) {
            seen.add('tiny');
            add('tiny-text', `${style.fontSize} ${describe(element)}`);
          }
        }
      }
    }
    const main = document.querySelector('main');
    if (main && main.scrollWidth > main.clientWidth + 1) results.push({ specimen: '(page)', kind: 'overflow-x', detail: 'page scrolls sideways' });
    return { results, specimens: document.querySelectorAll('[data-specimen]').length };
  });

  page.off('pageerror', onError);
  page.off('console', onConsole);
  return { pageId, specimens: findings.specimens, findings: findings.results, errors: [...new Set(errors)] };
}

(async () => {
  const theme = { ...(presetId ? presetSettings(presetId) : {}), ...(dark ? { mode: 'dark' } : {}) };
  const pageIds = pagesArg.length > 0 ? pagesArg : builtPages();
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width, height: 1000 }, ignoreHTTPSErrors: true });
  const report = [];
  for (const pageId of pageIds) {
    let result = await auditPage(page, pageId, theme);
    // A dev-server reload mid-run shows as an empty page; try once more.
    if (result.specimens === 0) result = await auditPage(page, pageId, theme);
    report.push(result);
    const count = result.findings.length + result.errors.length + (result.specimens === 0 ? 1 : 0);
    console.log(`${count === 0 ? 'ok  ' : 'FAIL'} ${pageId} (${result.specimens} specimens)`);
    if (result.specimens === 0) console.log('     no specimens rendered');
    for (const finding of result.findings) console.log(`     ${finding.kind.padEnd(10)} ${finding.specimen}  ${finding.detail}`);
    for (const error of result.errors) console.log(`     console    ${error}`);
  }
  await browser.close();
  const out = flag('out');
  if (out) fs.writeFileSync(out, JSON.stringify(report, null, 2));
  const total = report.reduce((sum, entry) => sum + entry.findings.length + entry.errors.length + (entry.specimens === 0 ? 1 : 0), 0);
  console.log(`\n${report.length} pages, ${total} findings`);
  process.exit(total === 0 ? 0 : 1);
})();
