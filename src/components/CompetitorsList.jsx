import React, { useState } from 'react';
import { Search, Star, Bed, MapPin, ExternalLink, Filter, Sparkles } from 'lucide-react';
import { calculatePeriodPrice } from '../services/dataService';

export default function CompetitorsList({ competitors, selectedRange, onSelectProperty, activeCenter, myPropertyId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterType, setFilterType] = useState('Todos');

  const propertyTypes = ['Todos', 'Apartamento', 'Hotel', 'Casa', 'Studio'];

  const filtered = competitors.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comp.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFav = filterFavorite ? comp.isFavorite : true;
    const matchesType = filterType === 'Todos' || comp.type === filterType;
    return matchesSearch && matchesFav && matchesType;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/30 flex flex-col h-[540px]">
      
      {/* List Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            Concorrentes Mapeados
            <span className="text-xs bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
              {filtered.length} imóveis
            </span>
          </h3>
          <p className="text-xs text-slate-400">Clique para centralizar no mapa ao lado</p>
        </div>

        {/* Favorite VIP Filter Toggle */}
        <button
          onClick={() => setFilterFavorite(!filterFavorite)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterFavorite
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-slate-950' : ''}`} />
          <span>{filterFavorite ? '★ Apenas VIP' : 'Filtrar VIP'}</span>
        </button>
      </div>

      {/* Search Bar & Type Filter */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome, rua ou condomínio na Orla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {propertyTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-300 bg-slate-950/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable List Items */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhum imóvel encontrado com esses filtros.
          </div>
        ) : (
          filtered.map(comp => {
            const price = calculatePeriodPrice(comp, selectedRange);
            const isMyProperty = comp.id === myPropertyId;
            const isActive = activeCenter?.lat === comp.location?.lat && activeCenter?.lng === comp.location?.lng;

            return (
              <div
                key={comp.id}
                onClick={() => onSelectProperty(comp.location)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3.5 items-center ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                    : isMyProperty
                      ? 'bg-slate-950/90 border-cyan-500/30 hover:border-cyan-500/60'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80 hover:bg-slate-950'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  <img
                    src={comp.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                    alt={comp.name}
                    className="w-full h-full object-cover"
                  />
                  {comp.isFavorite && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-extrabold shadow">
                      ★
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {comp.platform}
                    </span>
                    <span className="text-sm font-extrabold text-white tracking-tight">
                      R$ {price.toFixed(2)}
                    </span>
                  </div>

                  <h4 className={`font-bold text-xs truncate mt-1 ${isMyProperty ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {comp.name}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 truncate">
                      <Bed className="w-3 h-3 text-cyan-400 flex-shrink-0" /> {comp.features?.bedrooms || 1} qto
                    </span>
                    {comp.features?.rating && (
                      <span className="text-amber-400 font-bold">★ {comp.features.rating}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
