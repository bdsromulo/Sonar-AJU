// Integração REST com a API do GitHub: ler e commitar arquivos JSON (observations.json)
// usando o Token PAT salvo localmente. Usado pelo Coletor.

export const fetchJsonFileFromGitHub = async (settings, filePath) => {
  const { repoOwner, repoName, branch, patToken } = settings;
  if (!patToken) throw new Error('Token PAT do GitHub não configurado no painel Gestão.');

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${patToken}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (response.status === 404) return { json: null, sha: null };
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erro ao ler ${filePath} no GitHub.`);
  }
  const data = await response.json();
  const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return { json: JSON.parse(decoded), sha: data.sha };
};

export const commitJsonFileToGitHub = async (settings, filePath, jsonData, commitMessage, sha = null) => {
  const { repoOwner, repoName, branch, patToken } = settings;
  if (!patToken) throw new Error('Token PAT do GitHub não configurado.');

  const jsonString = JSON.stringify(jsonData, null, 2) + '\n';
  const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const payload = { message: commitMessage, content: base64Content, branch: branch || 'main' };
  if (sha) payload.sha = sha;

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
    const err = await response.json().catch(() => ({}));
    throw new Error(`Falha no commit de ${filePath}: ${err.message || response.statusText}`);
  }
  return await response.json();
};
