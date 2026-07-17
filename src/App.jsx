import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Simulador from './components/Simulador';
import AdminPanel from './components/AdminPanel';
import ColetorPanel from './components/ColetorPanel';
import BookmarkletModal from './components/BookmarkletModal';
import { getCompetitors, saveCompetitors, getSettings } from './services/dataService';

export default function App() {
  const [competitors, setCompetitors] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'coletor' | 'admin'
  const [isBookmarkletModalOpen, setIsBookmarkletModalOpen] = useState(false);

  // AdminPanel (modelo v1) ainda usa a base antiga de concorrentes.
  useEffect(() => {
    setCompetitors(getCompetitors());
  }, []);
  useEffect(() => {
    if (competitors.length > 0) saveCompetitors(competitors);
  }, [competitors]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <Simulador />
        ) : activeTab === 'coletor' ? (
          <div className="animate-fadeIn">
            <ColetorPanel settings={settings} />
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

      <BookmarkletModal
        isOpen={isBookmarkletModalOpen}
        onClose={() => setIsBookmarkletModalOpen(false)}
      />

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">
            📡 Sonar Caju &copy; {new Date().getFullYear()} &mdash; Inteligência de Aluguéis de Temporada
          </p>
          <p>Orla de Aracaju / SE &bull; dados por observação de preço (data exata, hóspedes, pets).</p>
        </div>
      </footer>
    </div>
  );
}
