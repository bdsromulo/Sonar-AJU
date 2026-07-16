import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, MapPin, Award, ExternalLink, Bed, Users, CheckCircle2 } from 'lucide-react';
import { calculatePeriodPrice } from '../services/dataService';

// Componente para re-centralizar o mapa ao clicar em um item da lista
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || 15, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Cria pinos customizados usando divIcon do Leaflet e Tailwind
const createCustomIcon = (competitor, price, globalAverage, isMyProperty, isBenchmark) => {
  let bgClass = 'bg-slate-800 border-slate-600 text-slate-300';
  let badgeText = `R$ ${price}`;
  let pulseClass = '';

  if (isMyProperty) {
    bgClass = 'bg-gradient-to-r from-cyan-500 to-blue-600 border-white text-white shadow-cyan-500/50 scale-110 z-50';
    badgeText = `⭐ R$ ${price}`;
    pulseClass = 'ring-4 ring-cyan-400/40 animate-pulse';
  } else if (isBenchmark) {
    bgClass = 'bg-gradient-to-r from-purple-600 to-indigo-600 border-amber-300 text-white shadow-purple-500/50 scale-110 z-40';
    badgeText = `🎯 Arcus: R$ ${price}`;
    pulseClass = 'ring-4 ring-purple-400/40';
  } else {
    // Cálculo de variação vs Média Global
    const diffPercent = globalAverage > 0 ? ((price - globalAverage) / globalAverage) * 100 : 0;
    if (diffPercent <= -10) {
      // Verde = Abaixo da média (> 10% mais barato)
      bgClass = 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-600/40';
    } else if (diffPercent >= 10) {
      // Vermelho = Acima da média (> 10% mais caro)
      bgClass = 'bg-rose-600 border-rose-300 text-white shadow-rose-600/40';
    } else {
      // Amarelo = Na média (+- 10%)
      bgClass = 'bg-amber-500 border-amber-200 text-slate-950 font-extrabold shadow-amber-500/40';
    }
  }

  const html = `
    <div class="flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-125 cursor-pointer ${pulseClass}">
      <div class="${bgClass} px-2.5 py-1 rounded-full border-2 text-xs font-bold shadow-xl whitespace-nowrap flex items-center gap-1">
        ${competitor.isFavorite && !isMyProperty && !isBenchmark ? '<span class="text-amber-300 font-black">★</span>' : ''}
        <span>${badgeText}</span>
      </div>
      <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${
        isMyProperty ? 'border-t-cyan-500' : isBenchmark ? 'border-t-purple-600' : bgClass.includes('emerald') ? 'border-t-emerald-600' : bgClass.includes('rose') ? 'border-t-rose-600' : bgClass.includes('amber') ? 'border-t-amber-500' : 'border-t-slate-800'
      } -mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

export default function InteractiveMap({ competitors, myProperty, selectedRange, activeCenter, globalAverage }) {
  const centerCoord = activeCenter || { lat: -10.9858, lng: -37.0435 }; // Orla de Atalaia

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-black/60 z-10 bg-slate-950">
      
      {/* Legenda Flutuante sobre o Mapa */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl text-xs space-y-2 max-w-[210px]">
        <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Cores dos Pinos
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-emerald-300" />
          <span>Verde: Abaixo da média</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-medium">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-300" />
          <span>Amarelo: Na média (±10%)</span>
        </div>
        <div className="flex items-center gap-2 text-rose-400 font-medium">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-rose-300" />
          <span>Vermelho: Acima da média</span>
        </div>
        <div className="pt-1 border-t border-slate-800/80 flex items-center gap-2 text-purple-300 font-semibold">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block border border-amber-300" />
          <span>🎯 Arcus (Benchmark)</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block border border-white" />
          <span>⭐ Nossa Acomodação</span>
        </div>
      </div>

      <MapContainer
        center={[centerCoord.lat, centerCoord.lng]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={centerCoord} zoom={15} />

        {/* TileLayer escuro/moderno com alto contraste */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {competitors.map((comp) => {
          if (!comp.location || !comp.location.lat || !comp.location.lng) return null;
          
          const price = calculatePeriodPrice(comp, selectedRange);
          const isMyProperty = comp.id === myProperty?.id;
          const isBenchmark = comp.isBenchmark;
          
          const icon = createCustomIcon(comp, price, globalAverage, isMyProperty, isBenchmark);

          return (
            <Marker key={comp.id} position={[comp.location.lat, comp.location.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="w-64 p-1 text-slate-200">
                  
                  {/* Image Carousel / Header */}
                  <div className="relative h-36 -mx-1 -mt-1 rounded-t-xl overflow-hidden mb-3 bg-slate-800">
                    <img
                      src={comp.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                      alt={comp.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-slate-700">
                      {comp.platform}
                    </span>

                    {comp.isFavorite && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                        ★ Favorito VIP
                      </span>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-baseline">
                      <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
                        R$ {price.toFixed(2)} <span className="text-xs font-normal text-slate-300">/ noite</span>
                      </span>
                      {comp.features?.rating && (
                        <span className="text-xs bg-slate-900/90 text-amber-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border border-slate-700">
                          ★ {comp.features.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Address */}
                  <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">{comp.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-3">{comp.location.address}</p>

                  {/* Features badges */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Bed className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{comp.features?.bedrooms || 1} Quartos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Até {comp.features?.maxGuests || 2} hóspedes</span>
                    </div>
                    {comp.location?.distanceToBeachKm !== undefined && (
                      <div className="col-span-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>A apenas {comp.location.distanceToBeachKm * 1000}m da Praia da Atalaia</span>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <span>Ver no {comp.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
