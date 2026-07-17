import React, { useMemo, useState } from 'react';
import { Calendar, Users, TrendingUp, Target, Home, MapPin, Clock, AlertTriangle } from 'lucide-react';
import MarketMap from './MarketMap';
import {
  getCollectedWindows,
  buildMarketSnapshot,
  fmtBRL,
  fmtDateBR,
  daysAgo
} from '../services/marketData';

function FreshnessBadge({ iso }) {
  const d = daysAgo(iso);
  if (d == null) return null;
  const tone = d <= 3 ? 'text-emerald-400' : d <= 10 ? 'text-amber-400' : 'text-rose-400';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${tone}`}>
      <Clock className="w-3 h-3" /> há {d}d
    </span>
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

export default function Simulador() {
  const windows = useMemo(() => getCollectedWindows(), []);
  const [winKey, setWinKey] = useState(windows[0]?.key ?? null);
  const [focusCenter, setFocusCenter] = useState(null);

  const win = windows.find((w) => w.key === winKey) ?? windows[0] ?? null;
  const snapshot = useMemo(() => (win ? buildMarketSnapshot(win) : null), [win]);

  if (!snapshot) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center">
        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Ainda não há observações de preço</h2>
        <p className="text-sm text-slate-400 mt-2">
          Use a aba <strong>Coletor</strong> para registrar preços de concorrentes por data. Assim que
          houver dados, o simulador mostra o mercado por período aqui.
        </p>
      </div>
    );
  }

  const { stats } = snapshot;
  const priced = snapshot.rows
    .filter((r) => r.status === 'ok')
    .sort((a, b) => a.perNight - b.perNight);
  const unavailable = snapshot.rows.filter((r) => r.status === 'indisponivel');
  const noData = snapshot.rows.filter((r) => r.status === 'sem-dado' && r.listing.role !== 'candidate');

  const minePos =
    stats.minePerNight != null && stats.orlaAvg != null
      ? ((stats.minePerNight - stats.orlaAvg) / stats.orlaAvg) * 100
      : null;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Seletor de período (horizonte = janelas já coletadas) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-200">Período consultado</span>
          <span className="text-[11px] text-slate-500">
            (horizonte = {windows.length} janela{windows.length > 1 ? 's' : ''} já coletada{windows.length > 1 ? 's' : ''})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {windows.map((w) => {
            const active = w.key === win.key;
            return (
              <button
                key={w.key}
                onClick={() => setWinKey(w.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {fmtDateBR(w.checkin)} → {fmtDateBR(w.checkout)}
                <span className="block text-[10px] font-normal opacity-70">
                  {w.nights} noites · {w.adults ?? '?'} adultos · {w.availableCount}/{w.listingCount} com preço
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={TrendingUp}
          tone="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
          title="Média da Orla"
          subtitle={`${stats.orlaCount}/${stats.favTotal} favoritos com preço`}
          value={`${fmtBRL(stats.orlaAvg)}`}
          foot="por noite · custo total ÷ noites"
        />
        <KpiCard
          icon={Target}
          tone="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          title="Meta Arcus (50%)"
          subtitle={stats.arcusPerNight != null ? `Arcus: ${fmtBRL(stats.arcusPerNight)}/quarto · 2 qts ${fmtBRL(stats.arcusTwoRooms)}` : 'sem observação do Arcus'}
          value={fmtBRL(stats.arcusTarget)}
          foot="50% da diária de 2 quartos do Arcus"
        />
        <KpiCard
          icon={Home}
          tone="bg-slate-500/15 text-slate-300 border border-slate-500/30"
          title="Sua hospedagem"
          subtitle={stats.mineTracked ? 'apê do seu pai' : 'não cadastrada'}
          value={stats.minePerNight != null ? fmtBRL(stats.minePerNight) : '—'}
          foot={
            stats.minePerNight != null
              ? minePos != null
                ? `${minePos > 0 ? '+' : ''}${minePos.toFixed(0)}% vs. média da orla`
                : null
              : stats.mineTracked
                ? 'sem disponibilidade/preço neste período'
                : null
          }
        />
      </div>

      {/* Mapa + lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MarketMap snapshot={snapshot} focusCenter={focusCenter} />
        </div>
        <div className="lg:col-span-1 space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
          {priced.map((r) => {
            const pos =
              stats.orlaAvg != null ? (r.perNight - stats.orlaAvg) / stats.orlaAvg : 0;
            const tone =
              r.listing.role === 'mine'
                ? 'border-cyan-500/40'
                : r.listing.role === 'benchmark'
                  ? 'border-purple-500/40'
                  : pos < -0.1
                    ? 'border-emerald-500/30'
                    : pos > 0.1
                      ? 'border-rose-500/30'
                      : 'border-amber-500/30';
            return (
              <button
                key={r.listing.id}
                onClick={() => setFocusCenter([r.listing.location.lat, r.listing.location.lng])}
                className={`w-full text-left rounded-xl border ${tone} bg-slate-950/70 p-3 hover:bg-slate-900 transition-all`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {r.listing.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 flex-shrink-0">
                    {r.listing.platform}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-white">{fmtBRL(r.perNight)}<span className="text-[11px] font-normal text-slate-400">/noite</span></span>
                  <FreshnessBadge iso={r.collectedAt} />
                </div>
              </button>
            );
          })}

          {unavailable.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3" /> Sem disponibilidade ({unavailable.length})
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {unavailable.map((r) => r.listing.name.split(' ').slice(0, 4).join(' ')).join(' · ')}
              </div>
            </div>
          )}

          {noData.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-[11px] font-bold text-slate-400 mb-1">
                Sem coleta neste período ({noData.length})
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Colete estes no Coletor para completar o mapa deste período.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
