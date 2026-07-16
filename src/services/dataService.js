import initialCompetitors from '../../data/competitors.json';

const STORAGE_KEY = 'sonar_caju_competitors';
const SETTINGS_KEY = 'sonar_caju_settings';

export const getCompetitors = () => {
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (err) {
    console.error('Erro ao ler do localStorage:', err);
  }
  return initialCompetitors;
};

export const saveCompetitorsLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
    return false;
  }
};

// Alias usado pelo App.jsx (mantém compatibilidade de nomenclatura)
export const saveCompetitors = saveCompetitorsLocal;

export const resetToInitialData = () => {
  localStorage.removeItem(STORAGE_KEY);
  return initialCompetitors;
};

export const getSettings = () => {
  try {
    const localSettings = localStorage.getItem(SETTINGS_KEY);
    if (localSettings) {
      return JSON.parse(localSettings);
    }
  } catch (err) {
    console.error('Erro ao ler configurações:', err);
  }
  return {
    repoOwner: 'bdsromulo',
    repoName: 'Sonar-AJU',
    branch: 'main',
    patToken: '',
    myPropertyId: 'sample_my_property'
  };
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

export const calculatePeriodPrice = (competitor, targetDateRange) => {
  if (!competitor || !competitor.pricing) return 0;
  const { basePrice, calendar } = competitor.pricing;

  if (!targetDateRange || !calendar || calendar.length === 0) {
    return basePrice || 0;
  }

  // Find matching seasonal period in calendar
  // We check if targetDateRange overlaps with any calendar period
  const match = calendar.find(period => {
    return targetDateRange.season === period.seasonNote || 
           (targetDateRange.startDate && period.startDate && targetDateRange.startDate >= period.startDate && targetDateRange.startDate <= period.endDate);
  });

  if (match && match.pricePerNight) {
    return match.pricePerNight;
  }

  return basePrice || 0;
};
