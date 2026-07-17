import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Simulador from './components/Simulador';
import ColetorPanel from './components/ColetorPanel';
import ConfigPanel from './components/ConfigPanel';
import { getSettings } from './services/dataService';

export default function App() {
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'coletor' | 'config'

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
            <ConfigPanel settings={settings} setSettings={setSettings} />
          </div>
        )}
      </main>

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
