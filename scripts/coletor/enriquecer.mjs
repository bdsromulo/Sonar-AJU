#!/usr/bin/env node
/* =========================================================================
 * Sonar Caju — Enriquecedor de classificação
 * -------------------------------------------------------------------------
 * Visita cada imóvel uma vez (Chromium local) e preenche em listings.json:
 *   classification: { kind: 'hotel'|'residential', pool: bool|null, stars: 3|4|null }
 * - kind: inferido do nome/plataforma (não precisa da página)
 * - pool: procura a amenidade "Piscina" no texto da página (best-effort)
 * - stars: só para hotéis do Booking, da classe exibida (best-effort)
 *
 * Uso: node scripts/coletor/enriquecer.mjs [--limit N] [--headful]
 * ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const LISTINGS = resolve(__dir, '../../data/listings.json');

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? +args[args.indexOf('--limit') + 1] : null;
const HEADFUL = args.includes('--headful');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

// hotel se o nome disser "hotel"/"pousada" ou for o benchmark; senão residencial.
const inferKind = (l) =>
  l.role === 'benchmark' || /\b(hotel|pousada|resort|flat hotel)\b/i.test(l.name) ? 'hotel' : 'residential';

function extractInPage() {
  const text = document.body.innerText;
  // Piscina como amenidade (evita "vista para a piscina" isolada exigindo contexto de lista)
  const pool = /\bpiscina\b/i.test(text);
  // Estrelas (Booking): classe do hotel, se exibida
  let stars = null;
  const starEl = document.querySelector('[data-testid="rating-stars"], [data-testid="rating-squares"]');
  const label = starEl?.getAttribute('aria-label') || '';
  const lm = label.match(/(\d)\s*de\s*5\s*estrelas/i) || text.match(/Hotel de (\d) estrelas/i);
  if (lm) stars = +lm[1];
  return { pool, stars };
}

async function main() {
  let listings = JSON.parse(readFileSync(LISTINGS, 'utf-8'));
  const targets = listings.filter((l) => l.active).slice(0, LIMIT ?? undefined);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: !HEADFUL });
  const ctx = await browser.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }
  });
  const page = await ctx.newPage();

  let i = 0;
  for (const l of targets) {
    i++;
    const kind = inferKind(l);
    process.stdout.write(`[${i}/${targets.length}] ${l.id} (${kind}) ... `);
    let pool = null, stars = null;
    try {
      await page.goto(l.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(jitter(2500, 4000));
      const r = await page.evaluate(extractInPage);
      pool = r.pool;
      stars = kind === 'hotel' ? r.stars : null;
      console.log(`piscina=${pool}${kind === 'hotel' ? ` estrelas=${stars ?? '?'}` : ''}`);
    } catch (err) {
      console.log(`ERRO ${String(err).slice(0, 50)}`);
    }
    l.classification = { kind, pool, stars };
    await sleep(jitter(3500, 6500));
  }

  await browser.close();
  writeFileSync(LISTINGS, JSON.stringify(listings, null, 2) + '\n');
  const withPool = listings.filter((l) => l.classification?.pool === true).length;
  const hotels = listings.filter((l) => l.classification?.kind === 'hotel').length;
  console.log(`\n✅ Classificados ${targets.length}. Hotéis: ${hotels} | com piscina: ${withPool}. Revise e commite.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
