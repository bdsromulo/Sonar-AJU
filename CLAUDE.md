# CLAUDE.md — Regras e Contexto do Projeto Sonar

> Este arquivo é lido automaticamente por qualquer IA/assistente que trabalhe neste
> repositório. As regras abaixo valem para **todo o projeto**, não apenas para uma sessão.

## 🚫 Regra 1 — Nenhuma atribuição de IA (INEGOCIÁVEL)

Nenhuma inteligência artificial (Claude, Antigravity, Copilot, ou qualquer outra) deve,
em hipótese alguma:

- Adicionar-se como **contributor**, **co-author** ou **author** em commits.
- Incluir linhas do tipo `Co-Authored-By:`, `Generated with ...`, `🤖 ...` ou similares
  em mensagens de commit, PRs, tags, ou qualquer metadado do Git.
- Se creditar em arquivos de código, documentação, `package.json`, README ou comentários.

Todos os commits devem sair **exclusivamente** em nome do autor humano do projeto
(`Rômulo Silva <romulo.supersons@gmail.com>`). A configuração `.claude/settings.json`
já força `includeCoAuthoredBy: false`; mantenha assim. Se encontrar qualquer atribuição
de IA no histórico ou em arquivos, remova.

## 📍 Regra 2 — Local de trabalho oficial

O trabalho principal deste projeto vive **exclusivamente** no disco local:

```
C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju
```

- **NÃO** trabalhar, editar, rodar `npm`, ou versionar dentro do Google Drive
  (`I:\Meu Drive\Sonar Caju`). O Google Drive File Stream trava descritores de arquivo
  (`EBADF`) e conflita com o hot-reload do Vite. A meta do dono do projeto é remover
  a pasta do Drive completamente da jogada.
- A fonte de verdade é o **GitHub**: `https://github.com/bdsromulo/Sonar-AJU.git`.
  Tudo deve estar sincronizado lá.

## 🎯 Sobre o projeto

Portal web (SPA/PWA) de inteligência de mercado para precificação de aluguéis de
temporada na Orla de Aracaju/SE (Atalaia). Compara concorrentes do Airbnb/Booking em
mapa interativo, com KPIs de precificação. Hospedagem gratuita via **GitHub Pages**,
sem backend (persistência via GitHub REST API).

**Requisito crítico:** o sistema NUNCA pode arriscar bloqueio das contas de
Airbnb/Booking do dono. Coleta de preços deve ser feita por meios que não exponham
a sessão/IP pessoal (GitHub Actions ou bookmarklet local manual).

### Stack
- Vite 8 + React 19 + Tailwind CSS **v4** (usar `@import "tailwindcss";`, não a sintaxe v3)
- Leaflet / react-leaflet (mapa)
- lucide-react para ícones (⚠️ ícones de marca como `Github` foram removidos; use `GitBranch`)
- Python (`scripts/sync_prices.py`) rodando em GitHub Actions

### Rodar localmente
```powershell
cd "C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju"
npm install
npm run dev
```

### Antes de commitar
```powershell
npm run build   # precisa passar sem erros
npm run lint
```

## 🗺️ Estado / roadmap (redefinido em jul/2026)

`ESTADO_ATUAL_E_HANDOFF.md` e `REPOSITORIO.md` descrevem a fase inicial e estão
**parcialmente obsoletos**. Direção vigente:

- **Unidade de dado = observação de preço**: (imóvel, check-in/out exatos, hóspedes, pets)
  → preço total com breakdown. Append-only, com histórico. O modelo `basePrice + calendar`
  de temporadas está descontinuado.
- **Temporadas não existem na UI** — o gestor simula datas exatas. "Temporada" é apenas
  política de contenção de coleta (quais janelas de datas amostrar, com que frequência).
- **Coleta**: bookmarklet endurecido para favoritos; bookmarklet de página de busca para
  varredura ampla da orla. Nunca scraping via GitHub Actions (IP datacenter bloqueado).
- O front-end atual será reescrito em torno do simulador de datas — não investir nele.
- Aviso: o "1-Click Auto Sync" (`App.jsx`) e `scripts/sync_prices.py` são **simulações**
  (random) e não coletam nada real. Serão substituídos/rotulados quando a coleta real
  estiver de pé.
