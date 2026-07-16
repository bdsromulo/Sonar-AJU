import React, { useState } from 'react';
import { Settings, Save, Upload, Download, Plus, CheckCircle, AlertTriangle, Shield, GitBranch, RefreshCw, Key, HelpCircle, Trash2 } from 'lucide-react';
import { commitCompetitorsToGitHub, triggerGitHubSyncWorkflow } from '../services/githubService';
import { saveSettings } from '../services/dataService';

export default function AdminPanel({ competitors, setCompetitors, settings, setSettings, onOpenBookmarkletModal }) {
  const [activeSubTab, setActiveSubTab] = useState('settings');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loadingGitHub, setLoadingGitHub] = useState(false);

  // Form de novo concorrente
  const [newComp, setNewComp] = useState({
    name: '',
    platform: 'Airbnb',
    url: '',
    type: 'Apartamento',
    isFavorite: true,
    isBenchmark: false,
    address: 'Orla de Atalaia, Aracaju - SE',
    lat: -10.9880,
    lng: -37.0450,
    bedrooms: 2,
    basePrice: 350.00
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (saveSettings(settings)) {
      setStatusMsg({ type: 'success', text: 'Configurações do GitHub e PAT salvas no seu navegador (LocalStorage)!' });
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleCommitToGitHub = async () => {
    if (!settings.patToken) {
      setStatusMsg({ type: 'error', text: 'Por favor, insira e salve um Token PAT do GitHub antes de publicar.' });
      return;
    }
    setLoadingGitHub(true);
    setStatusMsg({ type: 'info', text: 'Enviando novos dados para o GitHub (PUT /contents/data/competitors.json)...' });
    try {
      await commitCompetitorsToGitHub(competitors, settings);
      setStatusMsg({ type: 'success', text: '🎉 Sucesso! Alterações publicadas em bdsromulo/Sonar-AJU. O site será atualizado em ~40s!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Erro: ${err.message}` });
    } finally {
      setLoadingGitHub(false);
    }
  };

  const handleTriggerSyncWorkflow = async () => {
    if (!settings.patToken) {
      setStatusMsg({ type: 'error', text: 'Token PAT necessário para disparar o robô de sincronização no GitHub.' });
      return;
    }
    setLoadingGitHub(true);
    setStatusMsg({ type: 'info', text: 'Acionando o Workflow de Sincronização em Nuvem do GitHub Actions...' });
    try {
      await triggerGitHubSyncWorkflow(settings);
      setStatusMsg({ type: 'success', text: '🤖 Robô de Sincronização disparado com sucesso! Os novos preços serão coletados em background.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Erro no disparo do robô: ${err.message}` });
    } finally {
      setLoadingGitHub(false);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(competitors, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "competitors.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            setCompetitors(imported);
            setStatusMsg({ type: 'success', text: `Importados ${imported.length} imóveis com sucesso!` });
          } else if (typeof imported === 'object' && imported.name && imported.pricing) {
            // Único imóvel importado via bookmarklet
            setCompetitors(prev => [...prev.filter(c => c.id !== imported.id), imported]);
            setStatusMsg({ type: 'success', text: `Imóvel "${imported.name}" importado com sucesso!` });
          } else {
            throw new Error('Formato de JSON não reconhecido');
          }
        } catch (err) {
          setStatusMsg({ type: 'error', text: 'Erro ao importar JSON: arquivo inválido.' });
        }
      };
    }
  };

  const handleAddCompetitor = (e) => {
    e.preventDefault();
    const created = {
      id: `custom_${Date.now()}`,
      name: newComp.name,
      platform: newComp.platform,
      url: newComp.url || 'https://www.booking.com/',
      type: newComp.type,
      isFavorite: newComp.isFavorite,
      isBenchmark: newComp.isBenchmark,
      location: {
        address: newComp.address,
        neighborhood: 'Atalaia',
        lat: parseFloat(newComp.lat) || -10.9880,
        lng: parseFloat(newComp.lng) || -37.0450,
        distanceToBeachKm: 0.2
      },
      features: {
        bedrooms: parseInt(newComp.bedrooms) || 1,
        bathrooms: 1,
        maxGuests: 4,
        hasPool: true,
        hasAirCond: true,
        hasParking: true,
        rating: 4.85
      },
      pricing: {
        basePrice: parseFloat(newComp.basePrice) || 300,
        cleaningFee: 120,
        calendar: []
      },
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
      ],
      lastUpdated: new Date().toISOString()
    };

    setCompetitors(prev => [created, ...prev]);
    setStatusMsg({ type: 'success', text: `Imóvel "${created.name}" adicionado com sucesso! Lembre-se de publicar no GitHub.` });
    setNewComp({
      name: '', platform: 'Airbnb', url: '', type: 'Apartamento', isFavorite: true, isBenchmark: false, address: 'Orla de Atalaia', lat: -10.9880, lng: -37.0450, bedrooms: 2, basePrice: 350.00
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Admin Header */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            Painel de Administração do Sonar Caju
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie diárias, cadastre imóveis e publique atualizações diretamente no repositório <strong className="text-cyan-400">bdsromulo/Sonar-AJU</strong>.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenBookmarkletModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Ver Bookmarklet de Coleta</span>
          </button>
          
          <button
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar JSON Local</span>
          </button>

          <button
            onClick={handleCommitToGitHub}
            disabled={loadingGitHub}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <GitBranch className="w-4 h-4" />
            <span>{loadingGitHub ? 'Publicando...' : 'Publicar no GitHub (Deploy Oficial)'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' :
          statusMsg.type === 'error' ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' :
          'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'settings' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" /> Configurações do Repositório & Token PAT
        </button>
        <button
          onClick={() => setActiveSubTab('new_property')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'new_property' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" /> Cadastrar Concorrente (Ou Nossa Hospedagem)
        </button>
        <button
          onClick={() => setActiveSubTab('sync_robot')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'sync_robot' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Robô de Sincronização 1-Click
        </button>
      </div>

      {/* Sub Tab: Configurações do Repositório */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Conexão Segura com o GitHub (bdsromulo/Sonar-AJU)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              O Token PAT é armazenado exclusivamente no <strong className="text-slate-200">LocalStorage do seu navegador</strong>, garantindo que o site público no GitHub Pages permaneça 100% estático e seguro sem expor senhas no código.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Proprietário do Repositório (Owner)</label>
              <input
                type="text"
                value={settings.repoOwner}
                onChange={(e) => setSettings({...settings, repoOwner: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Nome do Repositório (Repo Name)</label>
              <input
                type="text"
                value={settings.repoName}
                onChange={(e) => setSettings({...settings, repoName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Token de Acesso Pessoal (GitHub PAT - Fine-Grained ou Classic)
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.patToken}
                onChange={(e) => setSettings({...settings, patToken: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Crie um token em <strong className="text-slate-400">github.com/settings/tokens</strong> dando permissão de leitura/gravação em <strong className="text-slate-400">Contents</strong> e <strong className="text-slate-400">Workflows</strong> para <strong className="text-slate-400">bdsromulo/Sonar-AJU</strong>.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Credenciais no Navegador</span>
            </button>
          </div>
        </form>
      )}

      {/* Sub Tab: Cadastrar Imóvel / Concorrente */}
      {activeSubTab === 'new_property' && (
        <form onSubmit={handleAddCompetitor} className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Cadastrar Concorrente (ou Nossa Hospedagem)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Insira os dados do imóvel aqui para que o pino e as diárias apareçam no mapa e nos cálculos do Sonar Caju.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">Nome / Título da Acomodação</label>
              <input
                type="text"
                required
                placeholder="Ex: Apartamento Duplex Frente Mar Atalaia"
                value={newComp.name}
                onChange={(e) => setNewComp({...newComp, name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Plataforma</label>
              <select
                value={newComp.platform}
                onChange={(e) => setNewComp({...newComp, platform: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Airbnb">Airbnb</option>
                <option value="Booking">Booking.com</option>
                <option value="Direto">Direto (Nossa Hospedagem)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Diária Média Base (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="350.00"
                value={newComp.basePrice}
                onChange={(e) => setNewComp({...newComp, basePrice: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Quartos</label>
              <input
                type="number"
                value={newComp.bedrooms}
                onChange={(e) => setNewComp({...newComp, bedrooms: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Tipo de Imóvel</label>
              <select
                value={newComp.type}
                onChange={(e) => setNewComp({...newComp, type: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa de Temporada</option>
                <option value="Hotel">Hotel</option>
                <option value="Studio">Studio / Flat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Latitude GPS (ex: -10.9880)</label>
              <input
                type="number"
                step="any"
                required
                value={newComp.lat}
                onChange={(e) => setNewComp({...newComp, lat: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Longitude GPS (ex: -37.0450)</label>
              <input
                type="number"
                step="any"
                required
                value={newComp.lng}
                onChange={(e) => setNewComp({...newComp, lng: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                <input
                  type="checkbox"
                  checked={newComp.isFavorite}
                  onChange={(e) => setNewComp({...newComp, isFavorite: e.target.checked})}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span>★ Lista de Favoritos VIP</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-400">
                <input
                  type="checkbox"
                  checked={newComp.isBenchmark}
                  onChange={(e) => setNewComp({...newComp, isBenchmark: e.target.checked})}
                  className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0 w-4 h-4"
                />
                <span>🎯 É Benchmark (ex: Arcus)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar à Lista de Monitoramento</span>
            </button>
          </div>
        </form>
      )}

      {/* Sub Tab: Robô de Sincronização */}
      {activeSubTab === 'sync_robot' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              Como Acionar o Robô de Sincronização em Nuvem (GitHub Actions)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              O robô de sincronização roda automaticamente no servidor do GitHub e coleta as diárias de todos os links cadastrados.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-3">
            <p><strong>Para ativar o robô no repositório <code className="text-cyan-400">bdsromulo/Sonar-AJU</code>:</strong></p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-400">
              <li>O workflow <code className="text-emerald-400">.github/workflows/sync_prices.yml</code> será incluído no repositório.</li>
              <li>O workflow roda automaticamente <strong>toda madrugada (04h00)</strong> via Cron e também ao clicar no botão <strong>"1-Click Auto Sync"</strong> aqui no topo do painel!</li>
              <li>Ele busca as tarifas sem fazer login, usando rotação de abas para não sobrecarregar as plataformas nem colocar contas em risco.</li>
            </ol>

            <div className="pt-3">
              <button
                onClick={handleTriggerSyncWorkflow}
                disabled={loadingGitHub}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingGitHub ? 'animate-spin' : ''}`} />
                <span>Testar Disparo do Robô Agora (`workflow_dispatch`)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
