// Núcleo de leitura do modelo v2: junta listings + observations e computa
// a foto de mercado para uma janela de datas (período) escolhida.
import listings from '../../data/listings.json';
import observations from '../../data/observations.json';

export const getListings = () => listings;
export const getObservations = () => observations;

export const nightsBetween = (checkin, checkout) => {
  if (!checkin || !checkout) return null;
  const d = (new Date(`${checkout}T12:00`) - new Date(`${checkin}T12:00`)) / 864e5;
  return d > 0 ? Math.round(d) : null;
};

const windowKey = (q) => `${q.checkin}__${q.checkout}__${q.adults ?? '?'}`;

// Lista de janelas (períodos) que têm observações, mais recentes/relevantes primeiro.
export const getCollectedWindows = () => {
  const map = new Map();
  for (const o of observations) {
    if (!o.query?.checkin || !o.query?.checkout) continue;
    const key = windowKey(o.query);
    const nights = nightsBetween(o.query.checkin, o.query.checkout);
    let w = map.get(key);
    if (!w) {
      w = {
        key,
        checkin: o.query.checkin,
        checkout: o.query.checkout,
        adults: o.query.adults ?? null,
        nights,
        listingIds: new Set(),
        availableCount: 0,
        lastCollectedAt: o.collectedAt
      };
      map.set(key, w);
    }
    w.listingIds.add(o.listingId);
    if (o.available === true) w.availableCount += 1;
    if (o.collectedAt > w.lastCollectedAt) w.lastCollectedAt = o.collectedAt;
  }
  return [...map.values()]
    .map((w) => ({ ...w, listingCount: w.listingIds.size }))
    .sort((a, b) => (a.checkin < b.checkin ? -1 : 1));
};

// Observação mais recente de um imóvel para uma janela exata.
const latestObsFor = (listingId, win) => {
  const cands = observations.filter(
    (o) =>
      o.listingId === listingId &&
      o.query?.checkin === win.checkin &&
      o.query?.checkout === win.checkout
  );
  if (!cands.length) return null;
  return cands.sort((a, b) => (a.collectedAt > b.collectedAt ? -1 : 1))[0];
};

// Foto de mercado para uma janela: cada imóvel com seu estado + estatísticas agregadas.
export const buildMarketSnapshot = (win) => {
  if (!win) return null;
  const nights = win.nights ?? nightsBetween(win.checkin, win.checkout);

  const rows = listings
    .filter((l) => l.active)
    .map((l) => {
      const obs = latestObsFor(l.id, win);
      const perNight =
        obs?.available && obs.price?.total != null && nights ? obs.price.total / nights : null;
      return {
        listing: l,
        obs,
        status: !obs ? 'sem-dado' : obs.available === false ? 'indisponivel' : perNight != null ? 'ok' : 'sem-preco',
        total: obs?.price?.total ?? null,
        perNight,
        collectedAt: obs?.collectedAt ?? null
      };
    });

  const favPerNights = rows
    .filter((r) => r.listing.role === 'favorite' && r.perNight != null)
    .map((r) => r.perNight);
  const orlaAvg = favPerNights.length
    ? favPerNights.reduce((a, b) => a + b, 0) / favPerNights.length
    : null;

  const arcusRow = rows.find((r) => r.listing.role === 'benchmark');
  const arcusPerNight = arcusRow?.perNight ?? null;
  const arcusTarget = arcusPerNight != null ? arcusPerNight / 2 : null;

  const mineRows = rows.filter((r) => r.listing.role === 'mine');
  const minePerNight = mineRows.find((r) => r.perNight != null)?.perNight ?? null;

  return {
    win,
    nights,
    rows,
    stats: {
      orlaAvg,
      orlaCount: favPerNights.length,
      favTotal: rows.filter((r) => r.listing.role === 'favorite').length,
      arcusPerNight,
      arcusTarget,
      minePerNight,
      mineAvailable: mineRows.some((r) => r.status === 'ok'),
      mineTracked: mineRows.length > 0
    }
  };
};

export const daysAgo = (iso) => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
};

export const fmtBRL = (v, opts = {}) =>
  v == null
    ? '—'
    : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: opts.cents === false ? 0 : 2, maximumFractionDigits: opts.cents === false ? 0 : 2 })}`;

export const fmtDateBR = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};
