import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';

const PRESET_SEASONS = [
  { label: 'Padrão / Baixa Temporada', season: 'Padrão', startDate: '2026-08-01', endDate: '2026-08-31' },
  { label: 'Férias de Julho', season: 'Férias de Julho', startDate: '2026-07-01', endDate: '2026-07-31' },
  { label: 'Feriadão (Independência)', season: 'Feriadão da Independência', startDate: '2026-09-04', endDate: '2026-09-07' },
  { label: 'Réveillon / Alta Temporada', season: 'Réveillon / Alta Temporada', startDate: '2026-12-20', endDate: '2027-01-05' },
  { label: 'Carnaval 2027', season: 'Carnaval', startDate: '2027-02-12', endDate: '2027-02-17' }
];

export default function CalendarFilter({ selectedRange, setSelectedRange }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 mb-8 shadow-xl shadow-black/30 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              Calendário Iterativo de Períodos
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sazonalidade Ativa
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione um período abaixo para recalcular instantaneamente o preço do Arcus Hotel, concorrentes e cores do mapa.
            </p>
          </div>
        </div>

        {/* Season Preset Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {PRESET_SEASONS.map((preset) => {
            const isSelected = selectedRange?.season === preset.season;
            return (
              <button
                key={preset.season}
                onClick={() => setSelectedRange(preset)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {isSelected && <Sparkles className="w-3.5 h-3.5 text-slate-950" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Active Selection Details Banner */}
      {selectedRange && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-4 py-2.5 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulação ativa para: <strong className="text-cyan-300 font-semibold">{selectedRange.season}</strong></span>
          </div>
          <div className="text-slate-400">
            Período estimado: <span className="text-slate-300 font-mono">{selectedRange.startDate}</span> até <span className="text-slate-300 font-mono">{selectedRange.endDate}</span>
          </div>
        </div>
      )}
    </div>
  );
}
