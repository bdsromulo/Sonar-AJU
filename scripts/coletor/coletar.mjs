#!/usr/bin/env node
/* =========================================================================
 * Sonar Caju — Coletor local (Playwright)
 * -------------------------------------------------------------------------
 * Roda no PC do Rômulo (NUNCA em GitHub Actions — IP de datacenter é bloqueado).
 * Abre um Chromium real (que hidrata o SPA do Airbnb, diferente de fetch), varre
 * favoritos + benchmark para janelas de datas quinzenais, e faz APPEND em
 * data/observations.json. Ritmo humano; suporta rodar em partes.
 *
 * Uso:
 *   node scripts/coletor/coletar.mjs --dry-run          # só mostra o plano
 *   node scripts/coletor/coletar.mjs --platform booking # só Booking
 *   node scripts/coletor/coletar.mjs --windows 0-3      # só as 4 primeiras janelas
 *   node scripts/coletor/coletar.mjs --limit 3          # só os 3 primeiros imóveis
 *   node scripts/coletor/coletar.mjs --headful          # com janela visível
 *
 * Pré-requisito (uma vez): npm i -D playwright && npx playwright install chromium
 * ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { extractInPage, buildUrl, generateWindows } from './extract.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');
const LISTINGS = resolve(ROOT, 'data/listings.json');
const OBS = resolve(ROOT, 'data/observations.json');

// ---- args ----
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DRY = has('--dry-run');
const HEADFUL = has('--headful');
const PLATFORM = val('--platform', null); // 'airbnb' | 'booking'
const LIMIT = val('--limit', null) ? +val('--limit') : null;
const WINDOWS_ARG = val('--windows', null); // "0-3" ou "2"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

function selectWindows() {
  let w = generateWindows({ months: 6, stepDays: 14, nights: 3, adults: 4 });
  if (WINDOWS_ARG) {
    const [a, b] = WINDOWS_ARG.split('-').map(Number);
    w = w.slice(a, (Number.isNaN(b) ? a : b) + 1);
  }
  return w;
}

function selectListings() {
  let ls = JSON.parse(readFileSync(LISTINGS, 'utf-8')).filter((l) => l.active && l.role !== 'candidate');
  if (PLATFORM) ls = ls.filter((l) => l.platform === PLATFORM);
  if (LIMIT) ls = ls.slice(0, LIMIT);
  return ls;
}

const sameObs = (a, b) =>
  a.listingId === b.listingId &&
  a.query?.checkin === b.query?.checkin &&
  a.query?.checkout === b.query?.checkout &&
  (a.query?.adults ?? null) === (b.query?.adults ?? null) &&
  String(a.collectedAt).slice(0, 10) === String(b.collectedAt).slice(0, 10);

async function main() {
  const listings = selectListings();
  const windows = selectWindows();
  const plan = listings.length * windows.length;
  console.log(`\n📡 Sonar Coletor local`);
  console.log(`   imóveis: ${listings.length} | janelas: ${windows.length} | consultas: ${plan}`);
  console.log(`   janelas: ${windows.map((w) => w.checkin).join(', ')}`);
  console.log(`   ritmo humano ~6s/consulta → estimado ~${Math.round((plan * 6) / 60)} min\n`);
  if (DRY) { console.log('(--dry-run: nada foi coletado)'); return; }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: !HEADFUL });
  const ctx = await browser.newContext({
    locale: 'pt-BR',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }
  });
  const page = await ctx.newPage();

  const log = JSON.parse(readFileSync(OBS, 'utf-8'));
  const before = log.length;
  let added = 0, dup = 0, fail = 0, i = 0;

  for (const listing of listings) {
    for (const q of windows) {
      i++;
      const url = buildUrl(listing, q);
      process.stdout.write(`[${i}/${plan}] ${listing.id} ${q.checkin}→${q.checkout} ... `);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // espera o orçamento (Airbnb: sidebar; Booking: tabela) hidratar
        const sel = listing.platform === 'airbnb' ? '[data-testid="book-it-default"]' : '#hprt-table';
        await page.waitForSelector(sel, { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(jitter(2500, 4000));
        const r = await page.evaluate(extractInPage, { adults: q.adults, children: q.children });
        const obs = {
          id: `obs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          listingId: listing.id,
          query: q,
          available: r.available,
          price: r.price,
          source: 'local-playwright',
          collectedAt: new Date().toISOString(),
          raw: r.raw
        };
        if (log.some((e) => sameObs(e, obs))) { dup++; console.log('dup'); }
        else {
          log.push(obs);
          added++;
          console.log(r.available === false ? 'indisponível' : r.price?.total != null ? `R$ ${r.price.total}` : 'sem preço ⚠');
        }
      } catch (err) {
        fail++;
        console.log(`ERRO ${String(err).slice(0, 60)}`);
      }
      // salva incremental (resiliente a interrupção)
      if (added && i % 10 === 0) writeFileSync(OBS, JSON.stringify(log, null, 2) + '\n');
      await sleep(jitter(4000, 8000)); // ritmo humano entre consultas
    }
    await sleep(jitter(3000, 6000)); // pausa extra ao trocar de imóvel
  }

  writeFileSync(OBS, JSON.stringify(log, null, 2) + '\n');
  await browser.close();
  console.log(`\n✅ Fim. +${added} observações (${dup} dup, ${fail} falhas). Log: ${before} → ${log.length}.`);
  console.log('   Revise o diff e commite data/observations.json.');
}

main().catch((e) => { console.error(e); process.exit(1); });
