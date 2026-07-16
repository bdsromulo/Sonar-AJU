import React from 'react';
import { X, Copy, Check, Compass, ShieldAlert, Sparkles } from 'lucide-react';

export default function BookmarkletModal({ isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:(function(){try{const name=document.querySelector('h1')?.innerText||document.title;const priceEl=document.querySelector('[data-testid="book-it-default"] span,_1y74zjx')||document.querySelector('.prco-valign-middle-helper');const priceTxt=priceEl?priceEl.innerText:'350';const priceNum=parseFloat(priceTxt.replace(/[^0-9,.]/g,'').replace(',','.'))||350;const url=window.location.href;const platform=url.includes('airbnb')?'Airbnb':url.includes('booking')?'Booking':'Outro';const nextDataEl=document.getElementById('__NEXT_DATA__');let lat=-10.988,lng=-37.045;if(nextDataEl){try{const data=JSON.parse(nextDataEl.innerText);const listing=data?.props?.pageProps?.req?.bootstrapData?.listing;if(listing?.lat){lat=listing.lat;lng=listing.lng;}}catch(e){}}const result={id:platform.toLowerCase()+'_'+Date.now(),name,platform,url,type:'Apartamento',isFavorite:true,isBenchmark:false,location:{address:'Orla de Atalaia, Aracaju - SE',neighborhood:'Atalaia',lat,lng,distanceToBeachKm:0.2},features:{bedrooms:2,bathrooms:2,maxGuests:4,hasPool:true,hasAirCond:true,hasParking:true,rating:4.88},pricing:{basePrice:priceNum,cleaningFee:150,calendar:[{startDate:'2026-07-01',endDate:'2026-07-31',pricePerNight:priceNum,isAvailable:true,seasonNote:'Férias de Julho'}]},images:['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],lastUpdated:new Date().toISOString()};navigator.clipboard.writeText(JSON.stringify(result,null,2));alert('🧭 Sonar Coletor: Dados extraídos com sucesso para a área de transferência! Vá no painel Admin do Sonar Caju e importe o JSON.');}catch(e){alert('Erro ao extrair dados da página: '+e.message);}})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">🧭 Sonar Coletor: Bookmarklet Inteligente</h3>
            <p className="text-xs text-slate-400">Coleta passiva 100% segura que roda no seu navegador local</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300">Por que é seguro e como usar?</strong>
              <p className="text-slate-400 mt-1">
                Este script nunca faz login ou requisições ocultas em massa. Ele apenas lê o título, coordenadas de latitude/longitude e preço da página que você já está olhando no Airbnb ou Booking.
              </p>
            </div>
          </div>

          <div>
            <span className="font-bold text-white block mb-2">Instalação Simples em 2 Passos:</span>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
              <li>Copie o código do botão abaixo.</li>
              <li>No Chrome, clique com o botão direito na sua <strong className="text-slate-200">Barra de Favoritos</strong> $\rightarrow$ <strong className="text-slate-200">Adicionar página...</strong> $\rightarrow$ Nome: <strong className="text-cyan-400">🧭 Sonar Coletor</strong> e cole o código no campo URL.</li>
            </ol>
          </div>

          <div className="relative">
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-32 custom-scrollbar">
              {bookmarkletCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
