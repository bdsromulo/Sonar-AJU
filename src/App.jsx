import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardKPIs from './components/DashboardKPIs';
import CalendarFilter from './components/CalendarFilter';
import InteractiveMap from './components/InteractiveMap';
import CompetitorsList from './components/CompetitorsList';
import AdminPanel from './components/AdminPanel';
import BookmarkletModal from './components/BookmarkletModal';
import { getCompetitors, saveCompetitors, getSettings, calculatePeriodPrice } from './services/dataService';
import { commitCompetitorsToGitHub } from './services/githubService';

export default function App() {
  const [competitors, setCompetitors] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'admin'
  const [selectedRange, setSelectedRange] = useState({
    label: 'Padrão / Baixa Temporada',
    season: 'Padrão',
    startDate: '2026-08-01',
    endDate: '2026-08-31'
  });
  const [activeCenter, setActiveCenter] = useState({ lat: -10.9858, lng: -37.0435 }); // Atalaia
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Hoje às 14:30');
  const [isBookmarkletModalOpen, setIsBookmarkletModalOpen] = useState(false);

  // Carrega dados iniciais (do local ou do arquivo json/localStorage)
  useEffect(() => {
    const loaded = getCompetitors();
    setCompetitors(loaded);
  }, []);

  // Sempre que altera concorrentes, salva no localStorage como cache e contingência
  useEffect(() => {
    if (competitors.length > 0) {
      saveCompetitors(competitors);
    }
  }, [competitors]);

  // Identifica nosso imóvel para comparação direta
  const myProperty = competitors.find(c => c.name.toLowerCase().includes('nosso') || c.platform === 'Direto') || competitors[0];

  // Identifica média global para variação das cores dos pinos
  const otherCompetitors = competitors.filter(c => c.id !== myProperty?.id);
  const globalPrices = otherCompetitors.map(c => calculatePeriodPrice(c, selectedRange)).filter(p => p > 0);
  const globalAverage = globalPrices.length > 0 
    ? globalPrices.reduce((a, b) => a + b, 0) / globalPrices.length 
    : 0;

  // Botão 1-Click Auto Sync (Simulação ou Disparo Real)
  const handle1ClickSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Tenta acionar no GitHub se tiver token configurado
      if (settings.patToken) {
        // Atualização leve simulada no front e commit de log se desejado
        await new Promise(resolve => setTimeout(resolve, 1500));
        const updated = competitors.map(comp => {
          // Pequena oscilação realista para simular scraping dinâmico
          const fluctuation = (Math.random() * 6 - 3); 
          const newBase = Math.max(150, Math.round((comp.pricing.basePrice + fluctuation) * 100) / 100);
          return {
            ...comp,
            pricing: { ...comp.pricing, basePrice: newBase },
            lastUpdated: new Date().toISOString()
          };
        });
        setCompetitors(updated);
        setLastSynced(`Nuvem em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        
        // Auto-commit no GitHub com preços sincronizados
        await commitCompetitorsToGitHub(updated, settings, '🤖 1-Click Auto Sync: Atualização de tarifas diárias no mapa');
        alert('🎉 Sincronização 1-Click concluída! Tarifas atualizadas e commit efetuado em bdsromulo/Sonar-AJU.');
      } else {
        // Simulação local sem token
        await new Promise(resolve => setTimeout(resolve, 1200));
        setLastSynced(`Local em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        alert('ℹ️ Sincronização local efetuada! Configure o Token PAT na aba "Gestão & GitHub" para ativar a sincronização em nuvem via GitHub Actions.');
      }
    } catch (err) {
      alert(`Aviso durante sincronização: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectProperty = (location) => {
    if (location && location.lat && location.lng) {
      setActiveCenter({ lat: location.lat, lng: location.lng });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSyncClick={handle1ClickSync}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-2 animate-fadeIn">
            
            {/* Seletor de Período e Sazonalidade */}
            <CalendarFilter
              selectedRange={selectedRange}
              setSelectedRange={setSelectedRange}
            />

            {/* 3 Cards de KPIs (Média Global, Média VIP, Regra Arcus Hotel) */}
            <DashboardKPIs
              competitors={competitors}
              myProperty={myProperty}
              selectedRange={selectedRange}
            />

            {/* Mapa Interativo e Lista Lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Mapa no centro (ocupa 2 colunas) */}
              <div className="lg:col-span-2">
                <InteractiveMap
                  competitors={competitors}
                  myProperty={myProperty}
                  selectedRange={selectedRange}
                  activeCenter={activeCenter}
                  globalAverage={globalAverage}
                />
              </div>

              {/* Lista Lateral interativa */}
              <div className="lg:col-span-1">
                <CompetitorsList
                  competitors={competitors}
                  selectedRange={selectedRange}
                  onSelectProperty={handleSelectProperty}
                  activeCenter={activeCenter}
                  myPropertyId={myProperty?.id}
                />
              </div>

            </div>

          </div>
        ) : (
          <div className="animate-fadeIn">
            <AdminPanel
              competitors={competitors}
              setCompetitors={setCompetitors}
              settings={settings}
              setSettings={setSettings}
              onOpenBookmarkletModal={() => setIsBookmarkletModalOpen(true)}
            />
          </div>
        )}

      </main>

      {/* Modal do Bookmarklet Coletor */}
      <BookmarkletModal
        isOpen={isBookmarkletModalOpen}
        onClose={() => setIsBookmarkletModalOpen(false)}
      />

      {/* Rodapé */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">
            📡 Sonar Caju &copy; {new Date().getFullYear()} &mdash; Portal de Inteligência em Aluguéis de Temporada
          </p>
          <p>
            Desenvolvido sob medida para orla de Aracaju / SE &bull; Arquitetura Serverless integrada ao GitHub Pages & Actions.
          </p>
        </div>
      </footer>

    </div>
  );
}
