import React from 'react';
import { TrendingUp, Star, Target, DollarSign, Award, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { calculatePeriodPrice } from '../services/dataService';

export default function DashboardKPIs({ competitors, myProperty, selectedRange }) {
  // 1. Média Global da Orla (excluindo nosso imóvel de referência do cálculo)
  const otherCompetitors = competitors.filter(c => c.id !== myProperty?.id);
  const globalPrices = otherCompetitors.map(c => calculatePeriodPrice(c, selectedRange)).filter(p => p > 0);
  const globalAverage = globalPrices.length > 0 
    ? globalPrices.reduce((a, b) => a + b, 0) / globalPrices.length 
    : 0;

  // 2. Média da Lista de Favoritos
  const favoriteCompetitors = otherCompetitors.filter(c => c.isFavorite);
  const favoritePrices = favoriteCompetitors.map(c => calculatePeriodPrice(c, selectedRange)).filter(p => p > 0);
  const favoriteAverage = favoritePrices.length > 0 
    ? favoritePrices.reduce((a, b) => a + b, 0) / favoritePrices.length 
    : 0;

  // 3. Regra Arcus Hotel (metade do valor do Arcus para 2 quartos)
  const arcusHotel = competitors.find(c => c.isBenchmark || c.name.toLowerCase().includes('arcus'));
  const arcusPrice = arcusHotel ? calculatePeriodPrice(arcusHotel, selectedRange) : 0;
  const arcusTarget = arcusPrice > 0 ? arcusPrice / 2 : 0;

  // Nosso preço atual no período
  const myCurrentPrice = myProperty ? calculatePeriodPrice(myProperty, selectedRange) : 0;
  const priceDiffVsTarget = arcusTarget > 0 ? ((myCurrentPrice - arcusTarget) / arcusTarget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Média Global */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40 hover:border-cyan-500/40 transition-all group">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Média Global da Orla</h3>
              <p className="text-[11px] text-slate-400">Geral Atalaia ({globalPrices.length} imóveis)</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            {selectedRange?.season || 'Período Padrão'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            R$ {globalAverage.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 font-medium">/ noite</span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Sua diária: <strong className="text-slate-200">R$ {myCurrentPrice.toFixed(2)}</strong></span>
          <span className={`font-semibold flex items-center gap-0.5 ${
            myCurrentPrice <= globalAverage ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {myCurrentPrice <= globalAverage ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            {myCurrentPrice <= globalAverage ? 'Abaixo da média' : 'Acima da média'}
          </span>
        </div>
      </div>

      {/* Card 2: Média dos Favoritos */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40 hover:border-amber-500/40 transition-all group">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Média de Favoritos</h3>
              <p className="text-[11px] text-slate-400">Seleção Restrita ({favoritePrices.length} favoritos)</p>
            </div>
          </div>
          <span className="text-[11px] font-bold tracking-wide text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            ★ VIP LIST
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
            R$ {favoriteAverage.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 font-medium">/ noite</span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Comparado aos favoritos</span>
          <span className="font-semibold text-slate-300">
            {favoriteAverage > 0 ? `${((myCurrentPrice / favoriteAverage) * 100).toFixed(0)}% do valor médio` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Card 3: Regra Arcus Hotel (Meta Sugerida) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl shadow-emerald-950/20 hover:border-emerald-500/60 transition-all group">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                Regra Arcus Hotel <Award className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-emerald-400/80">Meta recomendada: 50% de {arcusHotel?.name?.split(' ')[0] || 'Arcus'}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            Alvo 2 Quartos
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            R$ {arcusTarget.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 font-medium">/ noite</span>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Arcus ({selectedRange?.season || 'Atual'}): <strong className="text-slate-200">R$ {arcusPrice.toFixed(2)}</strong>
          </span>
          <span className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
            Math.abs(priceDiffVsTarget) <= 5 
              ? 'bg-emerald-500/20 text-emerald-300' 
              : priceDiffVsTarget < -5 
                ? 'bg-cyan-500/20 text-cyan-300' 
                : 'bg-amber-500/20 text-amber-300'
          }`}>
            {priceDiffVsTarget > 0 ? `+${priceDiffVsTarget.toFixed(0)}% vs meta` : `${priceDiffVsTarget.toFixed(0)}% vs meta`}
          </span>
        </div>
      </div>

    </div>
  );
}
