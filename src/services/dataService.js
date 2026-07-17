// Configurações locais (GitHub PAT/repo) usadas pelo Coletor para commitar observações.
// Guardadas apenas no LocalStorage do navegador — nunca versionadas.
const SETTINGS_KEY = 'sonar_caju_settings';

export const getSettings = () => {
  try {
    const local = localStorage.getItem(SETTINGS_KEY);
    if (local) return { ...defaults(), ...JSON.parse(local) };
  } catch (err) {
    console.error('Erro ao ler configurações:', err);
  }
  return defaults();
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return false;
  }
};

function defaults() {
  return { repoOwner: 'bdsromulo', repoName: 'Sonar-AJU', branch: 'main', patToken: '' };
}
