#!/usr/bin/env node
/* =========================================================================
 * Sonar Caju — Coletor de calendário (Airbnb)
 * -------------------------------------------------------------------------
 * Puxa, por imóvel do Airbnb, o calendário de 12 meses via a API interna
 * PdpAvailabilityCalendar — uma chamada leve devolve, por dia:
 *   available (bool) e minNights (estadia mínima).
 * (A API NÃO devolve preço por noite de forma confiável — o preço exato de
 *  um intervalo continua vindo do coletor de preço por consulta.)
 *
 * Robusto a rotação: abre 1 anúncio, captura a API key + o hash da persisted
 * query da própria rede, e reusa pra todos os imóveis (fetch same-origin).
 *
 * Saída: data/availability.json  { [listingId]: { collectedAt, days: {date:[av,min]} } }
 * Uso: node scripts/coletor/calendario.mjs [--limit N] [--headful]
 * ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const LISTINGS = resolve(__dir, '../../data/listings.json');
const OUT = resolve(__dir, '../../data/availability.json');

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? +args[args.indexOf('--limit') + 1] : null;
const HEADFUL = args.includes('--headful');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

async function main() {
  const listings = JSON.parse(readFileSync(LISTINGS, 'utf-8'));
  let airbnb = listings.filter((l) => l.active && l.platform === 'airbnb');
  if (LIMIT) airbnb = airbnb.slice(0, LIMIT);
  if (!airbnb.length) { console.log('Nenhum imóvel Airbnb ativo.'); return; }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: !HEADFUL });
  const ctx = await browser.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }
  });
  const page = await ctx.newPage();

  // Captura hash + api key da chamada real de calendário.
  let hash = null, apiKey = null;
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('PdpAvailabilityCalendar')) {
      const m = u.match(/PdpAvailabilityCalendar\/([a-f0-9]{64})/);
      if (m) hash = m[1];
      const k = req.headers()['x-airbnb-api-key'];
      if (k) apiKey = k;
    }
  });

  const seedId = airbnb[0].platformId;
  console.log('🔑 abrindo 1 anúncio para capturar chave/hash...');
  await page.goto(`https://www.airbnb.com.br/rooms/${seedId}?adults=4`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(4000);
  if (!hash) hash = 'be60714ead0a30db42ce6471ddad6a8f3855df0ed400b79282dd0bb8cecdf201'; // fallback
  if (!apiKey) apiKey = await page.evaluate(() => (document.documentElement.innerHTML.match(/"key":"([^"]{20,})"/) || [])[1]);
  console.log(`   hash=${hash.slice(0, 10)}… key=${apiKey ? 'ok' : 'FALTOU'}\n`);
  if (!apiKey) { console.log('❌ não capturei a API key.'); await browser.close(); return; }

  const now = new Date();
  const store = {};
  let i = 0;
  for (const l of airbnb) {
    i++;
    process.stdout.write(`[${i}/${airbnb.length}] ${l.id} ... `);
    try {
      const data = await page.evaluate(
        async ({ id, hash, apiKey, month, year }) => {
          const vars = encodeURIComponent(JSON.stringify({ request: { count: 12, listingId: id, month, year, returnPropertyLevelCalendarIfApplicable: false } }));
          const ext = encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }));
          const url = `/api/v3/PdpAvailabilityCalendar/${hash}?operationName=PdpAvailabilityCalendar&locale=pt&currency=BRL&variables=${vars}&extensions=${ext}`;
          const r = await fetch(url, { headers: { 'X-Airbnb-Api-Key': apiKey }, credentials: 'include' });
          if (!r.ok) return { error: r.status };
          const j = await r.json();
          const months = j?.data?.merlin?.pdpAvailabilityCalendar?.calendarMonths || [];
          return { days: months.flatMap((m) => m.days).map((d) => [d.calendarDate, d.available ? 1 : 0, d.minNights]) };
        },
        { id: l.platformId, hash, apiKey, month: now.getMonth() + 1, year: now.getFullYear() }
      );
      if (data.error) { console.log(`HTTP ${data.error}`); }
      else {
        const days = {};
        for (const [date, av, min] of data.days) days[date] = [av, min];
        store[l.id] = { collectedAt: new Date().toISOString(), days };
        const avail = data.days.filter((d) => d[1] === 1).length;
        console.log(`${data.days.length} dias (${avail} disp.)`);
      }
    } catch (err) {
      console.log(`ERRO ${String(err).slice(0, 50)}`);
    }
    await sleep(jitter(1500, 3000));
  }

  await browser.close();
  writeFileSync(OUT, JSON.stringify(store, null, 2) + '\n');
  console.log(`\n✅ Calendário de ${Object.keys(store).length} imóveis salvo em data/availability.json. Revise e commite.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
