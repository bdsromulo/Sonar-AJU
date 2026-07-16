# 🧭 REPOSITORIO.md — Sonar Caju: Portal de Inteligência de Mercado (Aracaju/SE)

> **Documento Mestre para Desenvolvedores e Inteligências Artificiais (LLMs)**  
> Este repositório contém a especificação e (futuramente) o código-fonte do **Sonar Caju**, uma plataforma web interativa de inteligência de concorrência e monitoramento de preços de acomodações de temporada (Booking.com e Airbnb) na região litorânea de Aracaju/SE (foco na Orla de Atalaia / praias vizinhas).

---

## 📋 1. Visão Geral e Objetivos do Projeto

O **Sonar Caju** foi idealizado para ser uma ferramenta de apoio à decisão e precificação para a gestão de acomodações locais. O objetivo principal é proporcionar ao gestor (e ao proprietário) uma visualização rica, interativa e intuitiva de:
- **Concorrentes Diretos e Indiretos**: Casas de temporada, apartamentos e hotéis próximos.
- **Geolocalização Interativa**: Mapa visual com marcadores por faixa de preço, esquema de cores (verde a vermelho) e mapa de calor.
- **Variação Sazonal por Calendário & Sincronização em 1 Clique**: Simulação e comparação de diárias por períodos selecionados, com **busca automatizada de preços** que varre e registra as tarifas atualizadas das hospedagens com apenas um clique.
- **Indicadores Estratégicos de Benchmark (Regra Arcus Hotel)**: Destaque imediato para a **Média Global** da Orla vs. **Média da Lista de Favoritos**, além do cálculo em tempo real da meta de preço baseada em **50% do valor do Arcus Hotel** para 2 quartos.
- **Gestão Autônoma no Front-end**: Capacidade de atualizar preços, adicionar concorrentes e gerenciar dados na própria interface web, com salvamento sem servidor (Serverless via GitHub API).

---

## 🏛️ 2. Arquitetura e Stack Tecnológica Recomendada

Como um dos requisitos centrais é a **hospedagem gratuita e acessível via GitHub Pages**, a arquitetura foi desenhada para ser **Serverless / Single Page Application (SPA)** com um motor de automação em nuvem via **GitHub Actions**, mantendo alta performance, baixo custo e segurança total.

```
+-----------------------------------------------------------------------------------+
|                                 FRONT-END (SPA)                                   |
|   React + Vite + Tailwind CSS + Leaflet (Mapas) + Lucide Icons + Chart.js         |
+-----------------------------------------------------------------------------------+
       |                            |                              |
       v (Leitura)                  v (Edição/Commit via UI)       v (1-Click Sync)
+------------------------+  +-------------------------------+  +--------------------+
|  Repositório GitHub    |  |  GitHub API (REST / PAT) ou   |  |  GitHub Actions    |
|  (data/competitors.json|  |  LocalStorage / IndexedDB     |  |  (Workflow Dispatch|
|  & GitHub Pages)       |  |  (Exportação/Importação JSON) |  |  ou Cron Noturno)  |
+------------------------+  +-------------------------------+  +--------------------+
```

### 🛠️ Tecnologias Selecionadas
1. **Front-end**: `Vite` + `React` (JavaScript/TypeScript).
2. **Estilização & UI**: `Tailwind CSS` para design moderno, limpo e altamente visual (Dark/Light mode, Glassmorphism, cards interativos).
3. **Mapas**: `Leaflet` via `react-leaflet` com tiles abertos (`OpenStreetMap` / `CartoDB Positron`). Pinos coloridos de verde a vermelho, com filtro em tempo real.
4. **Sincronização & Robô de Preços**: `Python + Playwright / Requests` rodando em contêineres do **GitHub Actions** acionados pelo front-end ou em agendamento diário.
5. **Hospedagem**: **GitHub Pages** (compilação estática automática).

---

## 🎯 3. Indicadores de Painel & Regra de Benchmark (Arcus Hotel)

O Dashboard superior exibirá sempre **Cards de Indicadores Chave (KPIs)** para decisão imediata do gestor:
1. **Card 1 — Média Global da Região**: Média de preço diário do período selecionado considerando todas as acomodações mapeadas na Orla/Atalaia.
2. **Card 2 — Média da Lista de Favoritos**: Média restrita às acomodações pré-selecionadas pelo gestor (`isFavorite: true`).
3. **Card 3 — Meta de Preço (Benchmark Arcus Hotel)**: O **Arcus Hotel by Atalaia** (`isBenchmark: true`) é utilizado como termômetro de precificação da região. O sistema calcula automaticamente:
   $$\text{Meta Sugerida} = \frac{\text{Diária do Arcus Hotel (2 Quartos no período)}}{2}$$
   *Exemplo*: Se o Arcus está cobrando R$ 700,00 no feriado, o Sonar Caju sugere como meta R$ 350,00 para a sua acomodação de 2 quartos.

---

## ⚡ 4. Sincronização Automatizada em 1 Clique (`1-Click Auto Sync`)

Para atender à necessidade de buscar valores atualizados das hospedagens automaticamente com apenas um clique sem exigir cópia manual e sem arriscar a conta do usuário, adotamos a estratégia do **Motor de Sincronização via Nuvem (GitHub Actions Workflow Dispatch)** ou **Extensão de Coleta em Lote**:

### A. Modo Nuvem Automática (GitHub Actions — Recomendado para o Dia a Dia)
- **O Botão no Site**: No painel do Sonar Caju, ao lado do calendário, haverá um botão **"🔄 Sincronizar Preços Agora"** (ou a opção de atualizar um imóvel específico ao clicar nele).
- **O que acontece ao clicar**:
  1. O site envia um evento `workflow_dispatch` (via API REST do GitHub usando o token PAT salvo) disparando o nosso workflow `sync_prices.yml` na nuvem do GitHub.
  2. Um contêiner em nuvem sobe instantaneamente, roda o nosso script Python (`scripts/sync_prices.py`) de forma anônima e isolada.
  3. O robô varre as URLs cadastradas no `data/competitors.json` (tanto da lista de favoritos quanto gerais), extrai as tabelas de diárias dos próximos meses (`__NEXT_DATA__` no Airbnb ou endpoints do Booking) e grava os novos valores diretamente no JSON do repositório.
  4. Em 40 segundos, o portal recarrega na tela do seu pai com todos os preços diários e médias completamente atualizados!
- **Benefício Supremo**: Zero intervenção manual, zero uso da máquina local ou IP pessoal do seu pai, 100% automatizado e grátis.

### B. Modo Coleta em Lote no Chrome (Batch Extension / Helper Local)
- Como contingência adicional (caso alguma plataforma exija verificação de navegador real), fornecemos um **Bookmarklet/Extensão Batch**: ao clicar no botão "Atualizar em Lote" no navegador do seu pai, o script abre em segundo plano e lê sequencialmente os dados das acomodações em milissegundos usando a sessão anônima local, enviando o JSON final consolidado direto para a API do GitHub.

---

## 🔄 5. Como Funciona a Atualização via GitHub API (Modo 2 - Detalhado)

Como o site é hospedado no **GitHub Pages (sem servidor de backend em nuvem)**, a persistência de dados é feita gravando diretamente no arquivo `data/competitors.json` do próprio repositório no GitHub quando o gestor faz edições na interface web ou aciona o robô:

1. **Acesso ao Painel Admin no Site**: O seu pai/gestor entra na aba *"Administração / Editar Preços"* e faz login com uma senha de acesso.
2. **O Token PAT (Personal Access Token)**: No primeiro acesso, o gestor cola no navegador um Token do GitHub (`ghp_...`) criado especificamente com permissão restrita de gravação apenas para o repositório do **Sonar Caju**. Esse token fica salvo com segurança no `LocalStorage` do navegador dele.
3. **O Fluxo de Gravação (PUT)**:
   - Quando o gestor altera um preço, cadastra uma nova pousada ou aciona a sincronização, o Front-end faz um `PUT` na API REST do GitHub gravando o novo `data/competitors.json`.
4. **Deploy Instantâneo**: O GitHub Actions detecta o novo commit e regenera o site estático rapidamente.

---

## 📊 6. Modelagem dos Dados (`data/schema.json`)

O esquema `data/schema.json` e a base `data/competitors.json` incluem os campos `isFavorite` e `isBenchmark` para alimentar os cards de Média de Favoritos e Regra do Arcus Hotel.

---

## 🤖 7. Instruções para Outras LLMs

Se você é uma LLM assumindo este repositório:
1. **Verifique sempre `isFavorite` e `isBenchmark`** ao calcular estatísticas no Dashboard.
2. **Conserve a filosofia Serverless / GitHub Pages**: Toda gravação deve usar `githubService.ts` via PUT REST API ou disparar o `workflow_dispatch`.
3. **Mantenha a UI Premium**: Dark/Light mode, Leaflet responsivo e indicadores visuais claros.
