// Serviço de integração REST com a API do GitHub para commit de dados stateless e disparo do Workflow do robô

export const getGitHubFileSha = async (settings, filePath = 'data/competitors.json') => {
  const { repoOwner, repoName, branch, patToken } = settings;
  if (!patToken) throw new Error('Token PAT do GitHub não configurado no painel.');

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (response.status === 404) {
    return null; // Arquivo ainda não existe na branch, PUT criará sem sha
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao consultar arquivo no GitHub.');
  }

  const data = await response.json();
  return data.sha;
};

export const commitCompetitorsToGitHub = async (competitorsData, settings, commitMessage = '🤖 Sonar Caju: Atualização de preços via Front-end') => {
  const { repoOwner, repoName, branch, patToken } = settings;
  if (!patToken) throw new Error('Token PAT do GitHub não configurado.');

  const filePath = 'data/competitors.json';
  const sha = await getGitHubFileSha(settings, filePath);

  const jsonString = JSON.stringify(competitorsData, null, 2);
  // Codificação segura em Base64 para UTF-8 em navegadores
  const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const payload = {
    message: commitMessage,
    content: base64Content,
    branch: branch || 'main'
  };

  if (sha) {
    payload.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Falha no commit GitHub API: ${errorData.message || response.statusText}`);
  }

  return await response.json();
};

export const triggerGitHubSyncWorkflow = async (settings) => {
  const { repoOwner, repoName, branch, patToken } = settings;
  if (!patToken) throw new Error('Token PAT necessário para acionar o robô no GitHub.');

  // Aciona workflow_dispatch para o robô de sincronização em nuvem
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/sync_prices.yml/dispatches`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${patToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: branch || 'main'
    })
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow sync_prices.yml não encontrado no repositório GitHub (veja as diretrizes para ativá-lo).');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erro ao disparar robô de sincronização: ${errorData.message || response.statusText}`);
  }

  return true;
};
