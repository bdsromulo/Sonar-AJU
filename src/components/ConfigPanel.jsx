import React, { useState } from 'react';
import { Settings, Save, Key, GitBranch, CheckCircle2, ShieldCheck } from 'lucide-react';
import { saveSettings } from '../services/dataService';

export default function ConfigPanel({ settings, setSettings }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const update = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = () => {
    if (saveSettings(form)) { setSettings(form); setSaved(true); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-cyan-400" /> Configuração
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Token do GitHub usado pelo <strong>Coletor</strong> para commitar observações. Fica só no
          navegador local (LocalStorage) — nunca é versionado.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400">
              Dono do repositório
              <input
                value={form.repoOwner}
                onChange={(e) => update('repoOwner', e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
            <label className="text-xs text-slate-400">
              Repositório
              <input
                value={form.repoName}
                onChange={(e) => update('repoName', e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
          </div>

          <label className="text-xs text-slate-400 block">
            <span className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Branch</span>
            <input
              value={form.branch}
              onChange={(e) => update('branch', e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-400 block">
            <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Token PAT do GitHub (permissão Contents: write)</span>
            <input
              type="password"
              value={form.patToken}
              onChange={(e) => update('patToken', e.target.value)}
              placeholder="github_pat_..."
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-sm text-slate-200 font-mono focus:border-cyan-500/60 focus:outline-none"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/25 hover:-translate-y-0.5 transition-all"
            >
              <Save className="w-4 h-4" /> Salvar configuração
            </button>
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> salvo
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Quem consulta não precisa disto.</strong> O token só é
          necessário na máquina que <em>coleta</em> e commita preços. Para consultar o mapa e a
          precificação por período, basta a aba <strong>Painel &amp; Mapa</strong>.
        </div>
      </section>
    </div>
  );
}
