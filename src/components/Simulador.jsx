import React, { useMemo, useState, useEffect } from 'react';
import {
  Calendar, Users, Target, Home, TrendingUp, Clock, AlertTriangle,
  SlidersHorizontal, RotateCcw, Minus, Plus
} from 'lucide-react';
import MarketMap from './MarketMap';
import {
  buildMarketSnapshot,
  getDefaultQuery,
  getCollectedWindows,
  nightsBetween,
  fmtBRL,
  fmtBRL0
} from '../services/marketData';

const BASE_OCCUPANCY = 4; // ocupação-base das coletas; hóspedes acima disso = "extra"

function Stepper({ value, onChange, min = 1, max = 16, label, icon: Icon }) {
  return (
    <div>
      <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </span>
      <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2.5 py-2 text-slate-400 hover:text-white"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-slate-100">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2.5 py-2 text-slate-400 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, tone, title, subtitle, value, foot }) {
  return (
    <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
      {foot && <div className="mt-2 text-xs text-slate-400">{foot}</div>}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, format }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className="text-xs font-bold text-cyan-300">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>
  );
}

export default function Simulador() {
  const [query, setQuery] = useState(getDefaultQuery);
  const [focusCenter, setFocusCenter] = useState(null);

  // Sliders do "seu preço"
  const [dailyBase, setDailyBase] = useState(null); // ancorado na mediana no 1º load
  const [longDisc, setLongDisc] = useState(10); // % máx p/ estadia longa
  const [extraGuestFee, setExtraGuestFee] = useState(40); // R$/noite por hóspede extra

  const windows = useMemo(() => getCollectedWindows(), []);
  const nights = nightsBetween(query.checkin, query.checkout);
  const snapshot = useMemo(
    () => (nights ? buildMarketSnapshot(query) : null),
    [query, nights]
  );
  const orlaMedian = snapshot?.stats?.orlaMedian ?? null;

  // Ancora a diária base na mediana da orla quando ela existir e o usuário ainda não mexeu.
  useEffect(() => {
    if (dailyBase == null && orlaMedian != null) setDailyBase(Math.round(orlaMedian));
  }, [orlaMedian, dailyBase]);

  const setQ = (patch) => setQuery((q) => ({ ...q, ...patch }));
  const setF = (patch) => setQuery((q) => ({ ...q, filters: { ...q.filters, ...patch } }));
  const filters = query.filters || {};

  // Cálculo do "seu preço" (por imóvel; sliders são premissas explícitas do gestor)
  const pricing = useMemo(() => {
    if (dailyBase == null || !nights) return null;
    const extraNights = Math.max(0, nights - 3);
    const progress = Math.min(1, extraNights / 4); // desconto progressivo até 7 noites
    const discount = (longDisc / 100) * progress;
    const nightlyAfterDisc = dailyBase * (1 - discount);
    const extraGuests = Math.max(0, query.guests - BASE_OCCUPANCY);
    const guestPerNight = extraGuests * extraGuestFee;
    const nightlyEffective = nightlyAfterDisc + guestPerNight;
    return {
      discountPct: discount * 100,
      extraGuests,
      guestPerNight,
      nightlyEffective,
      total: nightlyEffective * nights,
      vsOrla: orlaMedian ? (nightlyEffective - orlaMedian) / orlaMedian : null,
      vsArcus: snapshot?.stats?.arcusTarget
        ? (nightlyEffective - snapshot.stats.arcusTarget) / snapshot.stats.arcusTarget
        : null
    };
  }, [dailyBase, longDisc, extraGuestFee, nights, query.guests, orlaMedian, snapshot]);

  const rowsComparable = (snapshot?.rows ?? [])
    .filter((r) => r.comparable && r.perNight != null)
    .sort((a, b) => a.perNight - b.perNight);
  const rowsExcluded = (snapshot?.rows ?? []).filter((r) => !r.comparable && r.perNight != null);

  const { stats } = snapshot ?? { stats: {} };
  const today = new Date().toISOString().slice(0, 10);

  // Disponibilidade EXATA (calendário) para as datas escolhidas.
  const calRows = (snapshot?.rows ?? []).filter((r) => r.avail);
  const calAvail = calRows.filter((r) => r.avail.available === true).length;
  const calBlocked = calRows.filter((r) => r.avail.available === false).length;
  const calMinFail = calRows.filter((r) => r.avail.available !== false && r.avail.meetsMin === false).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Consulta: calendário + hóspedes + pet */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-200">Simular precificação</span>
          <span className="text-[11px] text-slate-500">as mesmas variáveis que um hóspede escolhe</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <label className="text-[11px] text-slate-400">
            Check-in
            <input
              type="date"
              value={query.checkin}
              min={today}
              onChange={(e) => setQ({ checkin: e.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-100 focus:border-cyan-500/60 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <label className="text-[11px] text-slate-400">
            Check-out
            <input
              type="date"
              value={query.checkout}
              min={query.checkin}
              onChange={(e) => setQ({ checkout: e.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-100 focus:border-cyan-500/60 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <Stepper value={query.guests} onChange={(v) => setQ({ guests: v })} label="Hóspedes" icon={Users} />
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Pet</span>
            <button
              onClick={() => setQ({ pet: !query.pet })}
              className={`w-full rounded-lg border p-2 text-sm font-semibold transition-all ${
                query.pet
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              🐾 {query.pet ? 'Com pet' : 'Sem pet'}
            </button>
          </div>
        </div>

        {/* Filtros de classificação */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/70">
          <span className="text-[11px] text-slate-500 mr-1">Comparar com:</span>
          {[
            { k: 'all', label: 'Tudo' },
            { k: 'residential', label: '🏠 Residencial' },
            { k: 'hotel', label: '🏨 Hotel' }
          ].map((o) => (
            <button
              key={o.k}
              onClick={() => setF({ kind: o.k })}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                (filters.kind || 'all') === o.k
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            onClick={() => setF({ poolOnly: !filters.poolOnly })}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              filters.poolOnly
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            🏊 Só com piscina
          </button>
          {filters.kind === 'hotel' && (
            <div className="flex items-center gap-1">
              {[0, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setF({ minStars: s })}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    (filters.minStars || 0) === s
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {s === 0 ? 'qualquer ★' : `${s}★+`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-[11px] text-slate-500">
            {nights ? `${nights} noite${nights > 1 ? 's' : ''}` : 'check-out deve ser após o check-in'}
            {query.pet && ' · aceita pet'}
            {query.guests > BASE_OCCUPANCY && ` · cabe ≥ ${query.guests}`}
            {filters.poolOnly && ' · com piscina'}
            {calRows.length > 0 && (
              <span className="text-slate-400">
                {' · '}📅 nestas datas (Airbnb): <b className="text-emerald-400">{calAvail} livres</b>
                {calBlocked > 0 && <>, <b className="text-rose-400">{calBlocked} lotados</b></>}
                {calMinFail > 0 && <>, {calMinFail} abaixo da estadia mín.</>}
              </span>
            )}
          </div>
          {windows.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">datas com boa coleta:</span>
              {windows.slice().sort((a, b) => b.priced - a.priced).slice(0, 3).map((w) => (
                <button
                  key={w.checkin}
                  onClick={() => setQ({ checkin: w.checkin, checkout: w.checkout })}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/40"
                >
                  {w.checkin.slice(8)}/{w.checkin.slice(5, 7)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!snapshot ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
          Escolha um check-out após o check-in para ver o mercado.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              icon={TrendingUp}
              tone="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              title="Mediana da Orla"
              subtitle={`${stats.orlaCount} comparáveis (cabem ${query.guests}${query.pet ? ' + pet' : ''})`}
              value={fmtBRL(stats.orlaMedian)}
              foot="por noite · concorrentes que servem a mesma consulta"
            />
            <KpiCard
              icon={Target}
              tone="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              title="Meta Arcus (50%)"
              subtitle={stats.arcusPerNight != null ? `Arcus ${fmtBRL0(stats.arcusPerNight)}/quarto · 2 qts ${fmtBRL0(stats.arcusTwoRooms)}` : 'sem coleta do Arcus p/ esta data'}
              value={fmtBRL(stats.arcusTarget)}
              foot="50% da diária de 2 quartos do Arcus"
            />
            <KpiCard
              icon={Home}
              tone="bg-slate-500/15 text-slate-300 border border-slate-500/30"
              title="Sua hospedagem"
              subtitle={stats.mineTracked ? `capacidade ${stats.mineCapacity ?? '?'}` : 'não cadastrada'}
              value={stats.minePerNight != null ? fmtBRL(stats.minePerNight) : '—'}
              foot={stats.minePerNight != null ? 'diária real coletada mais próxima' : 'sem coleta com preço p/ esta data'}
            />
          </div>

          {/* Mapa + lista + painel do seu preço */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <MarketMap snapshot={snapshot} focusCenter={focusCenter} />

              {/* Painel: Seu preço (sliders) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-slate-200">Seu preço</span>
                  </div>
                  <button
                    onClick={() => setDailyBase(orlaMedian != null ? Math.round(orlaMedian) : dailyBase)}
                    disabled={orlaMedian == null}
                    className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-cyan-300 disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" /> ancorar na mediana
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <Slider
                    label="Diária base"
                    value={dailyBase ?? 0}
                    onChange={setDailyBase}
                    min={100}
                    max={1500}
                    step={10}
                    format={(v) => fmtBRL0(v)}
                  />
                  <Slider
                    label="Desconto estadia longa (máx.)"
                    value={longDisc}
                    onChange={setLongDisc}
                    min={0}
                    max={30}
                    step={1}
                    format={(v) => `${v}%`}
                  />
                  <Slider
                    label={`Taxa/hóspede acima de ${BASE_OCCUPANCY}`}
                    value={extraGuestFee}
                    onChange={setExtraGuestFee}
                    min={0}
                    max={150}
                    step={5}
                    format={(v) => `${fmtBRL0(v)}/noite`}
                  />
                </div>

                {pricing && (
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                      <div>
                        <div className="text-[11px] text-slate-400">Sua diária efetiva</div>
                        <div className="text-2xl font-extrabold text-cyan-300">{fmtBRL(pricing.nightlyEffective)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Total {nights} noites</div>
                        <div className="text-2xl font-extrabold text-white">{fmtBRL(pricing.total)}</div>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        {pricing.vsOrla != null && (
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${pricing.vsOrla <= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                            {pricing.vsOrla > 0 ? '+' : ''}{(pricing.vsOrla * 100).toFixed(0)}% vs orla
                          </span>
                        )}
                        {pricing.vsArcus != null && (
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${Math.abs(pricing.vsArcus) <= 0.05 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/50 text-slate-300'}`}>
                            {pricing.vsArcus > 0 ? '+' : ''}{(pricing.vsArcus * 100).toFixed(0)}% vs meta Arcus
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>diária base {fmtBRL0(dailyBase)}</span>
                      {pricing.discountPct > 0 && <span>− {pricing.discountPct.toFixed(0)}% estadia longa</span>}
                      {pricing.extraGuests > 0 && <span>+ {fmtBRL0(pricing.guestPerNight)}/noite ({pricing.extraGuests} hóspede{pricing.extraGuests > 1 ? 's' : ''} extra)</span>}
                    </div>
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Desconto por duração e taxa por hóspede são <b className="text-slate-400">premissas suas</b> (sliders), não medidas na coleta atual.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de comparáveis */}
            <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {rowsComparable.map((r) => {
                const pos = orlaMedian != null ? (r.perNight - orlaMedian) / orlaMedian : 0;
                const tone =
                  r.listing.role === 'mine' ? 'border-cyan-500/40'
                  : r.listing.role === 'benchmark' ? 'border-purple-500/40'
                  : pos < -0.1 ? 'border-emerald-500/30'
                  : pos > 0.1 ? 'border-rose-500/30'
                  : 'border-amber-500/30';
                return (
                  <button
                    key={r.listing.id}
                    onClick={() => setFocusCenter([r.listing.location.lat, r.listing.location.lng])}
                    className={`w-full text-left rounded-xl border ${tone} bg-slate-950/70 p-3 hover:bg-slate-900 transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200 truncate">{r.listing.name}</span>
                      <span className="text-[10px] uppercase text-slate-500 flex-shrink-0">{r.listing.platform}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-extrabold text-white">
                        {fmtBRL(r.perNight)}<span className="text-[11px] font-normal text-slate-400">/noite</span>
                      </span>
                      {r.est && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.est.daysApart === 0 ? 'nesta data' : `~${r.est.daysApart}d`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {rowsExcluded.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="text-[11px] font-bold text-slate-400 mb-1">
                    Fora dos comparáveis ({rowsExcluded.length})
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    Não atendem à consulta ({query.guests} hóspedes
                    {query.pet ? ' + pet' : ''}
                    {filters.poolOnly ? ' + piscina' : ''}
                    {filters.kind && filters.kind !== 'all' ? ` + ${filters.kind === 'hotel' ? 'hotel' : 'residencial'}` : ''}).
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
