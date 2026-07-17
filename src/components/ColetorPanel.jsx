import React, { useMemo, useState } from 'react';
import { Compass, ClipboardPaste, CheckCircle2, AlertTriangle, UploadCloud, BookMarked } from 'lucide-react';
import coletorSource from '../../tools/coletor/coletor.js?raw';
import listings from '../../data/listings.json';
import { fetchJsonFileFromGitHub, commitJsonFileToGitHub } from '../services/githubService';

const OBS_PATH = 'data/observations.json';

const nightsBetween = (a, b) => {
  if (!a || !b) return null;
  const d = (new Date(`${b}T12:00`) - new Date(`${a}T12:00`)) / 864e5;
  return d > 0 ? Math.round(d) : null;
};

const fmtBRL = (v) =>
  v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function ColetorPanel({ settings }) {
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState(null); // { kind: 'ok'|'err', msg }
  const [isCommitting, setIsCommitting] = useState(false);

  const bookmarkletHref = useMemo(
    () => 'javascript:' + encodeURIComponent(coletorSource),
    []
  );

  const listingById = useMemo(() => {
    const map = new Map();
    for (const l of listings) map.set(l.id, l);
    return map;
  }, []);

  // Valida o texto colado e devolve { obsList, problems }
  const parsed = useMemo(() => {
    if (!pasted.trim()) return { obsList: [], problems: [] };
    let data;
    try {
      data = JSON.parse(pasted);
    } catch {
      return { obsList: [], problems: ['JSON inválido — cole exatamente o que o Coletor copiou.'] };
    }
    const arr = Array.isArray(data) ? data : [data];
    const problems = [];
    const obsList = [];
    arr.forEach((o, i) => {
      const tag = arr.length > 1 ? `Observação ${i + 1}: ` : '';
      if (!o || typeof o !== 'object') { problems.push(`${tag}não é um objeto.`); return; }
      if (!o.listingId) { problems.push(`${tag}sem listingId.`); return; }
      if (!listingById.has(o.listingId)) {
        problems.push(`${tag}${o.listingId} não está no registro de imóveis (cadastre antes ou confira o link).`);
      }
      if (!o.query?.checkin || !o.query?.checkout) {
        problems.push(`${tag}sem check-in/check-out — colete com as datas selecionadas na página.`);
      }
      if (o.available !== false && (!o.price || o.price.total == null) && o.price?.nightly == null) {
        problems.push(`${tag}sem preço e sem marcação de indisponível — provavelmente a página não tinha orçamento na tela.`);
      }
      obsList.push(o);
    });
    return { obsList, problems };
  }, [pasted, listingById]);

  const canCommit = parsed.obsList.length > 0 && parsed.problems.length === 0 && !isCommitting && !!settings?.patToken;

  const handleCommit = async () => {
    setIsCommitting(true);
    setStatus(null);
    try {
      const { json: current, sha } = await fetchJsonFileFromGitHub(settings, OBS_PATH);
      const log = Array.isArray(current) ? current : [];

      const sameQuery = (a, b) =>
        a.listingId === b.listingId &&
        a.query?.checkin === b.query?.checkin &&
        a.query?.checkout === b.query?.checkout &&
        (a.query?.adults ?? null) === (b.query?.adults ?? null) &&
        (a.query?.pets ?? null) === (b.query?.pets ?? null) &&
        String(a.collectedAt).slice(0, 10) === String(b.collectedAt).slice(0, 10);

      let added = 0, skipped = 0;
      for (const o of parsed.obsList) {
        if (log.some((e) => sameQuery(e, o))) { skipped++; continue; }
        log.push({
          id: `obs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          ...o
        });
        added++;
      }

      if (added === 0) {
        setStatus({ kind: 'err', msg: `Nada a adicionar: ${skipped} observação(ões) idêntica(s) já registradas hoje.` });
        return;
      }

      await commitJsonFileToGitHub(
        settings,
        OBS_PATH,
        log,
        `data: +${added} observacao(oes) de preco via coletor`,
        sha
      );
      setStatus({
        kind: 'ok',
        msg: `${added} observação(ões) commitada(s) no GitHub${skipped ? ` (${skipped} duplicada(s) ignorada(s))` : ''}. Log total: ${log.length}.`
      });
      setPasted('');
    } catch (err) {
      setStatus({ kind: 'err', msg: err.message });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Instalação */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-cyan-400" /> Coletor v2 — instalação
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Arraste o botão abaixo para a <strong className="text-slate-200">barra de favoritos</strong> do
          Chrome (desktop). Depois, em qualquer anúncio do Airbnb ou Booking com{' '}
          <strong className="text-slate-200">datas e hóspedes selecionados</strong>, clique nele: a
          observação de preço é copiada e aparece um painel de conferência.
        </p>
        {/* href setado via ref: React 19 bloqueia javascript: URLs passadas como prop */}
        <a
          ref={(el) => { if (el) el.setAttribute('href', bookmarkletHref); }}
          onClick={(e) => e.preventDefault()}
          draggable
          title="Arraste para a barra de favoritos"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-sm font-extrabold shadow-lg shadow-cyan-500/25 cursor-grab active:cursor-grabbing"
        >
          <BookMarked className="w-4 h-4" /> 📡 Sonar Coletor
        </a>
        <p className="text-[11px] text-slate-500 mt-3">
          Sem datas na URL o coletor avisa. Indisponibilidade também é registrada — é sinal de demanda.
        </p>
      </section>

      {/* Importação */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-2">
          <ClipboardPaste className="w-5 h-5 text-emerald-400" /> Importar observações
        </h2>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder='Cole aqui o JSON copiado pelo Coletor (uma observação ou uma lista [...]).'
          className="w-full h-44 rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-cyan-200 focus:border-cyan-500/60 focus:outline-none custom-scrollbar"
        />

        {/* Pré-visualização */}
        {parsed.obsList.length > 0 && (
          <div className="mt-4 space-y-2">
            {parsed.obsList.map((o, i) => {
              const l = listingById.get(o.listingId);
              const n = nightsBetween(o.query?.checkin, o.query?.checkout);
              const perNight = o.price?.total != null && n ? o.price.total / n : null;
              return (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
                  <div className="font-bold text-slate-200">{l ? l.name : o.listingId}</div>
                  <div className="text-slate-400 mt-0.5">
                    {o.query?.checkin} → {o.query?.checkout}{n ? ` (${n} noites)` : ''} ·{' '}
                    {o.query?.adults ?? '?'} adultos{o.query?.pets ? ` · ${o.query.pets} pet(s)` : ''}
                  </div>
                  {o.available === false ? (
                    <div className="text-amber-400 font-bold mt-1">Sem disponibilidade (registrado como dado)</div>
                  ) : (
                    <div className="text-emerald-300 font-semibold mt-1">
                      Total {fmtBRL(o.price?.total)}{perNight ? ` · ${fmtBRL(perNight)}/noite` : ''}
                      {o.price?.cleaning != null ? ` · limpeza ${fmtBRL(o.price.cleaning)}` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Problemas de validação */}
        {parsed.problems.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
            {parsed.problems.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {p}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCommit}
          disabled={!canCommit}
          className={`mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            canCommit
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:-translate-y-0.5'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          {isCommitting ? 'Commitando…' : 'Adicionar ao log e commitar no GitHub'}
        </button>

        {!settings?.patToken && (
          <p className="text-[11px] text-amber-400/90 mt-2">
            Configure o Token PAT na aba <strong>Gestão &amp; GitHub</strong> para habilitar o commit.
          </p>
        )}

        {status && (
          <div
            className={`mt-3 flex items-start gap-2 text-xs rounded-xl p-3 border ${
              status.kind === 'ok'
                ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                : 'text-rose-300 border-rose-500/30 bg-rose-500/10'
            }`}
          >
            {status.kind === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            {status.msg}
          </div>
        )}
      </section>
    </div>
  );
}
