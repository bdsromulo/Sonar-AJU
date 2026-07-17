// Lógica de extração de preço compartilhada pelo coletor local (Playwright).
// Espelha o Coletor v2 (bookmarklet), mas roda no contexto da página via page.evaluate.

// Executado DENTRO da página (browser). Recebe os parâmetros da query e devolve a observação.
export function extractInPage(query) {
  const num = (s) => {
    if (s == null) return null;
    s = String(s).replace(/[^\d.,]/g, '');
    if (!s) return null;
    return s.includes(',')
      ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
      : parseFloat(s.replace(/\.(?=\d{3}(\D|$))/g, ''));
  };
  const host = location.hostname;
  const body = document.body.innerText;

  if (host.includes('booking')) {
    const table = document.querySelector('#hprt-table');
    if (table) {
      const options = [];
      let lastRoom = null;
      for (const tr of table.querySelectorAll('tbody > tr')) {
        const roomEl = tr.querySelector('.hprt-roomtype-icon-link');
        if (roomEl) lastRoom = roomEl.innerText.trim().slice(0, 60);
        const occEl = tr.querySelector('.hprt-occupancy-occupancy-info');
        const occTxt = occEl ? occEl.getAttribute('data-title') || occEl.innerText : '';
        const maxG = (occTxt.match(/\d+/) || [null])[0];
        const priceEl = tr.querySelector('.hprt-table-cell-price');
        const tot = priceEl ? num((priceEl.innerText.match(/R\$\s?[\d.,]+/) || [null])[0]) : null;
        if (tot != null) options.push({ room: lastRoom, maxGuests: maxG ? +maxG : null, total: tot });
      }
      const fits = options.filter((o) => !query.adults || !o.maxGuests || o.maxGuests >= query.adults);
      const best = (fits.length ? fits : options).sort((a, b) => a.total - b.total)[0] || null;
      const taxesIncluded = /Impostos e taxas incluídos/i.test(table.innerText);
      return {
        available: !!best,
        price: best ? { total: best.total, nightly: null, cleaning: null, service: null, taxes: taxesIncluded ? 0 : null, currency: 'BRL' } : null,
        raw: { options: options.slice(0, 6), taxesIncluded }
      };
    }
    const unavailable = /Não temos disponibilidade aqui|estas datas estão disponíveis/i.test(body);
    return { available: unavailable ? false : null, price: null, raw: {} };
  }

  // Airbnb — o total (com desconto) fica no sidebar de reserva (book-it-default).
  const sidebar = document.querySelector('[data-testid="book-it-default"]');
  const sText = sidebar ? sidebar.innerText : body;

  if (/anúncio foi removido|não está mais disponível/i.test(body)) {
    return { available: false, price: null, raw: {} };
  }
  // Estadia mínima maior que a janela consultada: não há preço para este nº de noites.
  const minStay = sText.match(/Estadia mínima é de (\d+)/i);
  if (minStay && !/Total:/i.test(sText)) {
    return { available: null, price: null, raw: { reason: 'min-stay', minNights: +minStay[1] } };
  }
  if (/Adicione datas para ver os preços/i.test(sText) && !/Total:/i.test(sText)) {
    return { available: null, price: null, raw: { reason: 'sem-datas-ou-indisponivel' } };
  }

  // Remove a linha de parcelamento ("Ou 6x R$ 214 sem juros") e olha só antes do bloco CHECK-IN.
  const clean = sText.replace(/Ou\s*\d+\s*x\s*R\$\s?[\d.,]+[^\n]*/gi, '');
  const seg = clean.split(/CHECK-?IN/i)[0];
  const vals = [...seg.matchAll(/R\$\s?([\d.,]+)/g)].map((m) => num(m[1])).filter((v) => v != null);
  // Quando há desconto aparecem 2 valores (cheio, com desconto); o cobrado é o último.
  const total = vals.length ? vals[vals.length - 1] : null;
  const unavailable = /não est(?:á|ão) dispon[ií]ve|datas selecionadas não/i.test(body);

  return {
    available: total != null ? true : unavailable ? false : null,
    price: total != null ? { total, nightly: null, cleaning: null, service: null, taxes: null, currency: 'BRL' } : null,
    raw: { sidebarVals: vals.slice(0, 4) }
  };
}

// Monta a URL do anúncio para uma consulta (datas/hóspedes).
export function buildUrl(listing, q) {
  if (listing.platform === 'airbnb') {
    const p = new URLSearchParams({
      check_in: q.checkin, check_out: q.checkout,
      adults: String(q.adults ?? 2), children: String(q.children ?? 0),
      infants: String(q.infants ?? 0), pets: String(q.pets ?? 0)
    });
    return `https://www.airbnb.com.br/rooms/${listing.platformId}?${p}`;
  }
  const p = new URLSearchParams({
    checkin: q.checkin, checkout: q.checkout,
    group_adults: String(q.adults ?? 2), group_children: String(q.children ?? 0),
    no_rooms: String(q.rooms ?? 1)
  });
  return `https://www.booking.com/hotel/br/${listing.platformId}.pt-br.html?${p}`;
}

// Gera janelas quinzenais de 2 noites (sex→dom) cobrindo ~6 meses a partir de hoje.
export function generateWindows({ months = 6, stepDays = 14, nights = 3, adults = 4 } = {}) {
  const windows = [];
  const today = new Date();
  // primeiro sábado futuro como âncora de check-in de fim de semana
  const anchor = new Date(today);
  anchor.setDate(anchor.getDate() + ((6 - anchor.getDay() + 7) % 7 || 7));
  const end = new Date(today);
  end.setMonth(end.getMonth() + months);
  const iso = (d) => d.toISOString().slice(0, 10);
  for (let d = new Date(anchor); d <= end; d.setDate(d.getDate() + stepDays)) {
    const co = new Date(d);
    co.setDate(co.getDate() + nights);
    windows.push({ checkin: iso(d), checkout: iso(co), adults, children: 0, infants: 0, pets: 0, rooms: 1 });
  }
  return windows;
}
