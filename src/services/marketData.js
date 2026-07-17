// Núcleo do modelo v2. Junta listings + observations e responde a uma CONSULTA
// arbitrária (datas exatas, hóspedes, pet) estimando a diária de cada concorrente
// pela observação coletada mais próxima daquela data. Preço por IMÓVEL (não por
// pessoa): hóspedes/pet filtram os comparáveis; a diária é da unidade.
import listings from '../../data/listings.json';
import observations from '../../data/observations.json';

export const getListings = () => listings;
export const getObservations = () => observations;

export const nightsBetween = (checkin, checkout) => {
  if (!checkin || !checkout) return null;
  const d = (new Date(`${checkout}T12:00`) - new Date(`${checkin}T12:00`)) / 864e5;
  return d > 0 ? Math.round(d) : null;
};

export const daysAgo = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null);

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Capacidade de hóspedes: do registro; se faltar (Booking), do maior quarto já observado.
let _capMap = null;
const capacityMap = () => {
  if (_capMap) return _capMap;
  _capMap = new Map();
  for (const l of listings) {
    let c = l.capacity?.guests ?? null;
    if (c == null) {
      const gs = observations
        .filter((o) => o.listingId === l.id)
        .flatMap((o) => o.raw?.options || [])
        .map((x) => x.maxGuests)
        .filter(Boolean);
      if (gs.length) c = Math.max(...gs);
    }
    _capMap.set(l.id, c);
  }
  return _capMap;
};

// Diária estimada de um imóvel para uma data: observação com preço mais próxima do check-in.
export const estimateRateForDate = (listing, checkin) => {
  const cands = observations.filter((o) => o.listingId === listing.id && o.price?.total != null);
  if (!cands.length) return null;
  const target = new Date(`${checkin}T12:00`).getTime();
  let best = null;
  let bestDiff = Infinity;
  for (const o of cands) {
    const diff = Math.abs(new Date(`${o.query.checkin}T12:00`).getTime() - target) / 864e5;
    if (diff < bestDiff || (diff === bestDiff && o.collectedAt > best.collectedAt)) {
      best = o;
      bestDiff = diff;
    }
  }
  const n = nightsBetween(best.query.checkin, best.query.checkout) || 1;
  return {
    perNight: best.price.total / n,
    fromCheckin: best.query.checkin,
    daysApart: Math.round(bestDiff),
    daysAgo: daysAgo(best.collectedAt),
    obsNights: n
  };
};

// Foto de mercado para uma consulta arbitrária { checkin, checkout, guests, pet }.
export const buildMarketSnapshot = (query) => {
  const nights = nightsBetween(query.checkin, query.checkout);
  const caps = capacityMap();

  const rows = listings
    .filter((l) => l.active)
    .map((l) => {
      const est = estimateRateForDate(l, query.checkin);
      const cap = caps.get(l.id);
      const fitsGuests = cap == null ? null : cap >= query.guests;
      const fitsPet = !query.pet ? true : l.petsAllowed === true ? true : l.petsAllowed == null ? null : false;
      const comparable = fitsGuests !== false && fitsPet !== false;
      const perNight = est?.perNight ?? null;
      return {
        listing: l,
        est,
        perNight,
        estTotal: perNight != null && nights ? perNight * nights : null,
        cap,
        fitsGuests,
        fitsPet,
        comparable,
        status: perNight != null ? 'ok' : 'sem-dado'
      };
    });

  const favPerNights = rows
    .filter((r) => r.listing.role === 'favorite' && r.comparable && r.perNight != null)
    .map((r) => r.perNight);
  const orlaMedian = median(favPerNights);

  const arcusRow = rows.find((r) => r.listing.role === 'benchmark');
  const arcusPerNight = arcusRow?.perNight ?? null;

  const mineRow = rows.find((r) => r.listing.role === 'mine' && r.perNight != null);

  return {
    query,
    nights,
    rows,
    stats: {
      orlaMedian,
      orlaCount: favPerNights.length,
      favTotal: rows.filter((r) => r.listing.role === 'favorite').length,
      arcusPerNight,
      arcusTarget: arcusPerNight, // regra: 50% de 2 quartos = diária de 1 quarto
      arcusTwoRooms: arcusPerNight != null ? arcusPerNight * 2 : null,
      minePerNight: mineRow?.perNight ?? null,
      mineTracked: rows.some((r) => r.listing.role === 'mine'),
      mineCapacity: rows.find((r) => r.listing.role === 'mine')?.cap ?? null
    }
  };
};

// Janelas já coletadas (para sugerir uma data inicial com bom volume de dados).
export const getCollectedWindows = () => {
  const map = new Map();
  for (const o of observations) {
    if (!o.query?.checkin || !o.query?.checkout) continue;
    const key = `${o.query.checkin}__${o.query.checkout}`;
    let w = map.get(key);
    if (!w) { w = { checkin: o.query.checkin, checkout: o.query.checkout, priced: 0 }; map.set(key, w); }
    if (o.price?.total != null) w.priced += 1;
  }
  return [...map.values()].sort((a, b) => (a.checkin < b.checkin ? -1 : 1));
};

export const getDefaultQuery = () => {
  const best = getCollectedWindows().slice().sort((a, b) => b.priced - a.priced)[0];
  if (best) return { checkin: best.checkin, checkout: best.checkout, guests: 4, pet: false };
  return { checkin: '2026-08-15', checkout: '2026-08-18', guests: 4, pet: false };
};

export const fmtBRL = (v) =>
  v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtBRL0 = (v) =>
  v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
