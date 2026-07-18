import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmtBRL } from '../services/marketData';

const ATALAIA = [-10.9887, -37.0487];

// Cor do pino conforme posição do imóvel vs. mediana da orla para a consulta.
function markerStyle(row, orlaMedian) {
  if (row.listing.role === 'mine') return { color: '#22d3ee', fill: '#22d3ee', r: 11, op: 0.85 };
  if (row.listing.role === 'benchmark') return { color: '#a855f7', fill: '#a855f7', r: 10, op: 0.85 };
  if (row.perNight == null) return { color: '#475569', fill: '#1e293b', r: 6, op: 0.5 };
  // Fora dos comparáveis (não cabe / não aceita pet): apagado, mesmo tendo preço.
  if (!row.comparable) return { color: '#64748b', fill: '#334155', r: 6, op: 0.5 };
  if (orlaMedian == null) return { color: '#64748b', fill: '#334155', r: 7, op: 0.75 };
  const diff = (row.perNight - orlaMedian) / orlaMedian;
  if (diff < -0.1) return { color: '#10b981', fill: '#10b981', r: 8, op: 0.8 };
  if (diff > 0.1) return { color: '#f43f5e', fill: '#f43f5e', r: 8, op: 0.8 };
  return { color: '#f59e0b', fill: '#f59e0b', r: 8, op: 0.8 };
}

function Recenter({ center }) {
  const map = useMap();
  useMemo(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function MarketMap({ snapshot, focusCenter }) {
  const rows = snapshot?.rows ?? [];
  const orlaMedian = snapshot?.stats?.orlaMedian ?? null;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800 h-[520px]">
      <MapContainer center={ATALAIA} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Recenter center={focusCenter} />
        {rows.map((row) => {
          const { lat, lng } = row.listing.location;
          if (lat == null || lng == null) return null;
          const s = markerStyle(row, orlaMedian);
          const est = row.est;
          return (
            <CircleMarker
              key={row.listing.id}
              center={[lat, lng]}
              radius={s.r}
              pathOptions={{ color: s.color, fillColor: s.fill, fillOpacity: s.op, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>{row.listing.name.slice(0, 46)}</strong>
                  <br />
                  {row.perNight != null ? (
                    <>
                      <b>{fmtBRL(row.perNight)}</b>/noite
                      {row.estTotal != null && <> · total {fmtBRL(row.estTotal)}</>}
                      {!row.comparable && (
                        <><br /><span style={{ color: '#f59e0b' }}>
                          {row.fitsAvail === false
                            ? (row.avail?.available === false ? 'indisponível nas datas' : `mín. ${row.avail?.minNights} noites`)
                            : row.fitsGuests === false ? `cabe ${row.cap ?? '?'} hóspedes`
                            : row.fitsPet === false ? 'não aceita pet'
                            : row.fitsPool === false ? 'sem piscina'
                            : row.fitsKind === false ? (row.cls?.kind === 'hotel' ? 'é hotel' : 'é residencial')
                            : 'fora do filtro'}
                        </span></>
                      )}
                      {row.comparable && row.avail?.available === true && (
                        <><br /><span style={{ color: '#10b981' }}>✓ disponível nas datas</span></>
                      )}
                    </>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>sem observação de preço</span>
                  )}
                  {est && (
                    <><br /><span style={{ color: '#94a3b8' }}>
                      {est.daysApart === 0 ? 'coleta desta data' : `coleta ~${est.daysApart}d da data`}
                      {est.daysAgo != null ? ` · há ${est.daysAgo}d` : ''}
                    </span></>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
