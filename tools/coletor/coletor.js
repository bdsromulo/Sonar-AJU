/* =========================================================================
 * Sonar Caju — Coletor v2 (bookmarklet)
 * -------------------------------------------------------------------------
 * Uso: numa página de ANÚNCIO do Airbnb ou Booking, com datas/hóspedes já
 * selecionados na interface do site, clicar no favorito. O coletor lê:
 *   - os parâmetros da consulta (check-in/out, hóspedes, pets) da URL
 *   - o orçamento que a própria página calculou (total, diária, taxas)
 *   - indisponibilidade (que também é dado!)
 * e copia uma OBSERVAÇÃO (ver data/DATA_MODEL.md) para o clipboard, além de
 * mostrar um painel de conferência no canto da tela.
 *
 * Este arquivo é a FONTE legível. O painel "Coletor" do Sonar Caju gera o
 * link de bookmarklet a partir dele automaticamente (import ?raw + encode).
 * ========================================================================= */
(() => {
  const host = location.hostname;
  const P = host.includes('airbnb') ? 'airbnb' : host.includes('booking') ? 'booking' : null;
  if (!P) { alert('Sonar Coletor: abra a página de um anúncio no Airbnb ou no Booking.'); return; }

  const q = new URLSearchParams(location.search);
  const body = document.body.innerText;

  // "1.022,50" -> 1022.5 | "760" -> 760 | "R$ 1.617" -> 1617
  const num = (s) => {
    if (s == null) return null;
    s = String(s).replace(/[^\d.,]/g, '');
    if (!s) return null;
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return parseFloat(s.replace(/\.(?=\d{3}(\D|$))/g, ''));
  };
  const grab = (re) => { const r = body.match(re); return r ? num(r[1]) : null; };
  const nightsBetween = (a, b) => {
    if (!a || !b) return null;
    const d = (new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5;
    return d > 0 ? Math.round(d) : null;
  };

  let obs = null;
  const warnings = [];

  if (P === 'airbnb') {
    const m = location.pathname.match(/\/rooms\/(\d+)/);
    if (!m) { alert('Sonar Coletor: não achei o id do anúncio na URL.'); return; }

    const checkin = q.get('check_in'), checkout = q.get('check_out');
    if (!checkin || !checkout) warnings.push('Sem datas na URL — selecione as datas no anúncio antes de coletar.');

    const query = {
      checkin, checkout,
      adults: +(q.get('adults') || 0) || null,
      children: +(q.get('children') || 0),
      infants: +(q.get('infants') || 0),
      pets: +(q.get('pets') || 0)
    };

    // Camada 1: breakdown por rótulos pt-BR no texto renderizado do sidebar
    const nightlyXn = body.match(/R\$\s?([\d.,]+)\s*x\s*(\d+)\s*noites?/i);
    const cleaning = grab(/Taxa de limpeza\s*\n?\s*R\$\s?([\d.,]+)/i);
    const service = grab(/Taxa de serviço do Airbnb\s*\n?\s*R\$\s?([\d.,]+)/i);
    const total = grab(/Total(?:\s*\(BRL\)|\s*antes dos impostos)?\s*\n?\s*R\$\s?([\d.,]+)/i);
    // Camada 2: diária de vitrine ("R$ X noite")
    const nightly = nightlyXn ? num(nightlyXn[1]) : grab(/R\$\s?([\d.,]+)\s*\n?\s*(?:por\s*)?noite/i);

    const unavailable = /não est(?:á|ão) dispon[ií]ve|datas selecionadas não|anúncio foi removido/i.test(body);
    const hasPrice = total != null || nightly != null;
    if (!hasPrice && !unavailable) warnings.push('Não achei preço nem aviso de indisponibilidade — confira a página e o painel abaixo.');

    obs = {
      listingId: 'abnb-' + m[1],
      query,
      available: hasPrice ? true : (unavailable ? false : null),
      price: hasPrice ? { total, nightly, cleaning, service, taxes: null, currency: 'BRL' } : null,
      source: 'bookmarklet-listing',
      collectedAt: new Date().toISOString(),
      raw: { pageTitle: document.title.slice(0, 100), nightsInText: nightlyXn ? +nightlyXn[2] : null }
    };
  } else {
    const m = location.pathname.match(/\/hotel\/[a-z]{2}\/([^./]+)/);
    if (!m) { alert('Sonar Coletor: não achei o identificador do anúncio na URL.'); return; }

    const checkin = q.get('checkin'), checkout = q.get('checkout');
    if (!checkin || !checkout) warnings.push('Sem datas na URL — selecione as datas no anúncio antes de coletar.');

    const query = {
      checkin, checkout,
      adults: +(q.get('group_adults') || 0) || null,
      children: +(q.get('group_children') || 0),
      infants: 0,
      pets: null, // Booking não expõe pets como parâmetro de busca
      rooms: +(q.get('no_rooms') || 1)
    };

    const table = document.querySelector('#hprt-table');
    if (table) {
      // Tabela de disponibilidade: opções de quarto com preço TOTAL da estadia
      const options = [];
      let lastRoom = null;
      for (const tr of table.querySelectorAll('tbody > tr')) {
        const roomEl = tr.querySelector('.hprt-roomtype-icon-link');
        if (roomEl) lastRoom = roomEl.innerText.trim().slice(0, 60);
        const occEl = tr.querySelector('.hprt-occupancy-occupancy-info');
        const occTxt = occEl ? (occEl.getAttribute('data-title') || occEl.innerText) : '';
        const maxG = (occTxt.match(/\d+/) || [null])[0];
        const priceEl = tr.querySelector('.hprt-table-cell-price');
        const tot = priceEl ? num((priceEl.innerText.match(/R\$\s?[\d.,]+/) || [null])[0]) : null;
        if (tot != null) options.push({ room: lastRoom, maxGuests: maxG ? +maxG : null, total: tot });
      }
      const fits = options.filter(o => !query.adults || !o.maxGuests || o.maxGuests >= query.adults);
      const best = (fits.length ? fits : options).sort((a, b) => a.total - b.total)[0] || null;
      const taxesIncluded = /Impostos e taxas incluídos/i.test(table.innerText);
      if (!best) warnings.push('Tabela de disponibilidade sem preço legível — confira a página.');

      obs = {
        listingId: 'bkng-' + m[1],
        query,
        available: !!best,
        price: best ? { total: best.total, nightly: null, cleaning: null, service: null, taxes: taxesIncluded ? 0 : null, currency: 'BRL' } : null,
        source: 'bookmarklet-listing',
        collectedAt: new Date().toISOString(),
        raw: { pageTitle: document.title.slice(0, 100), options: options.slice(0, 8), taxesIncluded }
      };
    } else {
      const unavailable = /Não temos disponibilidade aqui|estas datas estão disponíveis/i.test(body);
      if (!unavailable) warnings.push('Sem tabela de preços e sem aviso claro de indisponibilidade — confira a página.');
      obs = {
        listingId: 'bkng-' + m[1],
        query,
        available: unavailable ? false : null,
        price: null,
        source: 'bookmarklet-listing',
        collectedAt: new Date().toISOString(),
        raw: { pageTitle: document.title.slice(0, 100) }
      };
    }
  }

  const nights = nightsBetween(obs.query.checkin, obs.query.checkout);
  const json = JSON.stringify(obs, null, 2);
  if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});

  // ---- Painel de conferência ----
  const old = document.getElementById('sonar-coletor-panel');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'sonar-coletor-panel';
  el.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:14px;padding:14px 16px;max-width:340px;font:12px/1.5 system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.6)';
  const fmt = (v) => v == null ? '—' : 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const totalNight = obs.price && obs.price.total != null && nights ? obs.price.total / nights : null;
  el.innerHTML =
    '<div style="font-weight:800;color:#22d3ee;margin-bottom:6px">📡 Sonar Coletor</div>' +
    '<div><b>' + obs.listingId + '</b></div>' +
    '<div>' + (obs.query.checkin || '?') + ' → ' + (obs.query.checkout || '?') + (nights ? ' (' + nights + ' noites)' : '') +
    ' · ' + (obs.query.adults ?? '?') + ' adultos' + (obs.query.pets ? ' · ' + obs.query.pets + ' pet(s)' : '') + '</div>' +
    (obs.available === false
      ? '<div style="color:#f59e0b;font-weight:700;margin-top:4px">SEM DISPONIBILIDADE (registrado como dado)</div>'
      : '<div style="margin-top:4px">Total: <b>' + fmt(obs.price && obs.price.total) + '</b>' +
        (totalNight ? ' · <b>' + fmt(totalNight) + '</b>/noite' : '') +
        (obs.price && obs.price.cleaning != null ? '<br>Limpeza: ' + fmt(obs.price.cleaning) : '') +
        (obs.price && obs.price.service != null ? ' · Serviço: ' + fmt(obs.price.service) : '') + '</div>') +
    (warnings.length ? '<div style="color:#fbbf24;margin-top:6px">⚠ ' + warnings.join('<br>⚠ ') + '</div>' : '') +
    '<div style="margin-top:8px;color:#94a3b8">JSON copiado — cole no painel <b>Coletor</b> do Sonar Caju.</div>' +
    '<div style="margin-top:8px;display:flex;gap:8px">' +
    '<button id="sonar-copy" style="background:#164e63;color:#a5f3fc;border:1px solid #155e75;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:700">Copiar de novo</button>' +
    '<button id="sonar-close" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:8px;padding:4px 10px;cursor:pointer">Fechar</button></div>';
  document.body.appendChild(el);
  document.getElementById('sonar-copy').onclick = () => navigator.clipboard.writeText(json);
  document.getElementById('sonar-close').onclick = () => el.remove();
})();
