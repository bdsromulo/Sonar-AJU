import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmtBRL, daysAgo } from '../services/marketData';

const ATALAIA = [-10.9887, -37.0487];

// Cor do pino conforme posição do imóvel vs. média da orla no período.
function markerStyle(row, orlaAvg) {
  if (row.listing.role === 'mine') return { color: '#22d3ee', fill: '#22d3ee', r: 11 };
  if (row.listing.role === 'benchmark') return { color: '#a855f7', fill: '#a855f7', r: 10 };
  if (row.status !== 'ok') return { color: '#475569', fill: '#1e293b', r: 6 };
  if (orlaAvg == null) return { color: '#64748b', fill: '#334155', r: 7 };
  const diff = (row.perNight - orlaAvg) / orlaAvg;
  if (diff < -0.1) return { color: '#10b981', fill: '#10b981', r: 8 };
  if (diff > 0.1) return { color: '#f43f5e', fill: '#f43f5e', r: 8 };
  return { color: '#f59e0b', fill: '#f59e0b', r: 8 };
}

function Recenter({ center }) {
  const map = useMap();
  useMemo(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function MarketMap({ snapshot, focusCenter }) {
  const rows = snapshot?.rows ?? [];
  const orlaAvg = snapshot?.stats?.orlaAvg ?? null;

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
          const s = markerStyle(row, orlaAvg);
          const dias = daysAgo(row.collectedAt);
          return (
            <CircleMarker
              key={row.listing.id}
              center={[lat, lng]}
              radius={s.r}
              pathOptions={{ color: s.color, fillColor: s.fill, fillOpacity: 0.75, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>{row.listing.name.slice(0, 46)}</strong>
                  <br />
                  {row.status === 'ok' ? (
                    <>
                      <b>{fmtBRL(row.perNight)}</b>/noite
                      <br />
                      total {fmtBRL(row.total)}
                    </>
                  ) : row.status === 'indisponivel' ? (
                    <span style={{ color: '#f59e0b' }}>sem disponibilidade</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>sem observação neste período</span>
                  )}
                  {dias != null && <><br /><span style={{ color: '#94a3b8' }}>coletado há {dias}d</span></>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
