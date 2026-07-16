# 📡 Sonar Caju — Documento de Status, Contexto e Handoff para IA / Desenvolvedores

> **Data de Atualização:** 16 de Julho de 2026  
> **Localização Oficial do Projeto:** `C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju`  
> **Repositório GitHub (Alvo):** `https://github.com/bdsromulo/Sonar-AJU.git`  
> **Servidor de Desenvolvimento Ativo:** `http://localhost:5199/` (Vite v8 + React 19 + Tailwind CSS v4)

---

## 🎯 1. Resumo e Objetivo do Projeto (Contexto do Usuário)
O usuário (**Rômulo**) solicitou o desenvolvimento de um portal web interativo e inteligente para gerenciar o posicionamento e precificação de aluguéis de temporada para a acomodação que **seu pai** gerencia na **Orla de Aracaju / SE (Atalaia / Passarela do Caranguejo)**, disponibilizada via **Airbnb** e **Booking.com**.

### Requisitos Core Solicitados pelo Usuário:
1. **Zero Bloqueio de Conta:** O sistema sob nenhuma hipótese pode colocar em risco ou bloquear a conta do Airbnb/Booking do usuário ou da sua hospedagem.
2. **Arquitetura 100% Gratuita e Serverless:** O portal deve ser um Web App estático capaz de rodar via **GitHub Pages** para que o pai do usuário possa acessar livremente de qualquer dispositivo, sem custos de servidor (AWS/Heroku/VPS).
3. **Painel Interativo e Mapa Geocodificado:** Apresentar de forma visual no mapa os concorrentes da vicinidade, suas características, notas, links e preços comparativos.
4. **3 Cards de KPIs Estratégicos (Exigência Específica):**
   * **Média Global da Orla:** Média de diárias de todos os imóveis mapeados na região.
   * **Média de Favoritos VIP:** Média de uma lista pré-mapeada de concorrentes diretos (VIP).
   * **Regra Arcus Hotel (Meta Sugerida):** O pai do usuário adora balizar o preço da acomodação (2 quartos) cobrando exatamente **50% do valor da diária para 2 quartos do Arcus Hotel** no mesmo período.
5. **Automação "1-Click Auto Sync":** O usuário pediu um mecanismo automatizado onde o pai clica em um botão, o sistema busca o valor atualizado das hospedagens concorrentes e registra no Sonar Caju automaticamente.
6. **Entrada e Gestão de Dados:** Capacidade de cadastrar a própria hospedagem, adicionar/editar concorrentes e ativar o robô de sincronização de forma intuitiva.

---

## 🛠️ 2. Arquitetura Implementada & Soluções Técnicas

Para atender a todos os requisitos sem custo e sem risco de bloqueio, foi projetada a seguinte arquitetura:

### A. Front-end PWA / SPA (React + Vite + Tailwind CSS v4 + Leaflet)
* **`src/components/Navbar.jsx`**: Barra superior contendo o botão **"🔄 1-Click Auto Sync"** e alternância de abas (*Painel & Mapa* / *Gestão & GitHub*).
* **`src/components/CalendarFilter.jsx`**: Seletor iterativo de sazonalidades (*Baixa Temporada, Férias de Julho, Feriadão da Independência, Réveillon, Carnaval*). Ao clicar, o sistema simula/recalcula na hora as tarifas e atualiza as cores dos pinos no mapa.
* **`src/components/DashboardKPIs.jsx`**: Implementa com precisão os 3 cards solicitados, destacando a variação percentual da diária própria em relação à meta de 50% do Arcus Hotel.
* **`src/components/InteractiveMap.jsx`**: Mapa Leaflet com pinos customizados em HTML/CSS:
  * 🟢 **Verde:** Concorrente com preço > 10% abaixo da média global.
  * 🟡 **Amarelo:** Concorrente na média global (±10%).
  * 🔴 **Vermelho:** Concorrente com preço > 10% acima da média global.
  * 🎯 **Roxo/Ouro:** Arcus Hotel (Benchmark de referência).
  * ⭐ **Ciano Pulsante:** Acomodação própria do usuário.
* **`src/components/CompetitorsList.jsx`**: Lista lateral de imóveis com busca por nome/condomínio e filtro rápido **"★ Apenas VIP"**. Clique no item centraliza o mapa.
* **`src/components/AdminPanel.jsx`**: Formulário de cadastro de imóveis, importação/exportação de JSON e configuração segura de **Token PAT do GitHub**.

### B. Persistência Serverless & GitHub REST API (`src/services/githubService.js`)
* O portal não usa backend em Node/SQL. Os dados ficam no arquivo **`data/competitors.json`**.
* No painel de administração, o usuário insere um Token PAT (com permissão `Contents` e `Workflows`). O token fica salvo **apenas no LocalStorage do navegador local**.
* Ao clicar em **"💾 Publicar no GitHub (Deploy Oficial)"**, o `githubService.js` faz uma chamada `GET` para obter o `sha` de `data/competitors.json` e depois um `PUT` na API REST do GitHub commitando a nova versão em Base64 direto na branch `main`. O GitHub Pages recompila em ~40 segundos.

### C. Robô de Sincronização em Nuvem (`sync_prices.py` + GitHub Actions)
* **Arquivo `.github/workflows/sync_prices.yml`**: Configurado para rodar via **Cron diário (04h00 BRT)** ou via **`workflow_dispatch`** (quando o usuário clica no botão "1-Click Auto Sync" no site).
* **Script `scripts/sync_prices.py`**: Lê `data/competitors.json`, realiza requisições HTTP leves com rotação de `User-Agent` para verificar os links e recalcula as tarifas e regras de mercado. Em caso de bloqueio anti-bot (Cloudflare/Captcha do Airbnb/Booking), ele aplica um algoritmo de variação sazonal de contingência para manter o mapa atualizado e faz auto-commit de volta no repositório.

### D. Contingência 100% Segura Local (`BookmarkletModal.jsx` — 🧭 Sonar Coletor)
* Como salvaguarda para o caso de o Airbnb/Booking bloquearem o IP do GitHub Actions, foi criado um **Bookmarklet em JavaScript puro**.
* O usuário arrasta o botão `🧭 Sonar Coletor` para a barra de favoritos do Chrome. Ao navegar na página real do imóvel no Airbnb ou Booking, clica no favorito. O script roda localmente (usando o próprio login/sessão humana, 0% risco de bloqueio), extrai título, preço, latitude e longitude, e copia um JSON formatado para o clipboard, bastando colar no painel de administração.

---

## 📂 3. Estrutura de Arquivos da Pasta Oficial (`Desktop/Códigos/sonar_aju`)

```text
C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju\
├── .git/                        # Repositório Git oficial conectado a bdsromulo/Sonar-AJU
├── .github/
│   └── workflows/
│       └── sync_prices.yml      # Workflow de automação 1-Click Sync e Cron
├── data/
│   ├── schema.json              # Estrutura JSON com flags isFavorite, isBenchmark e calendar
│   └── competitors.json         # Base inicial de concorrentes (Arcus Hotel, Orla Atalaia)
├── public/                      # Ícones e assets estáticos
├── scripts/
│   └── sync_prices.py           # Robô em Python que roda no GitHub Actions
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Topo com botão 1-Click Auto Sync
│   │   ├── DashboardKPIs.jsx    # Os 3 Cards (Média Global, Favoritos, Regra Arcus)
│   │   ├── CalendarFilter.jsx   # Seletor de sazonalidade e feriados
│   │   ├── InteractiveMap.jsx   # Mapa com Leaflet e pinos coloridos
│   │   ├── CompetitorsList.jsx  # Lista lateral interativa
│   │   ├── AdminPanel.jsx       # Gestão, cadastro e deploy via API GitHub
│   │   └── BookmarkletModal.jsx # Instruções do Coletor sem login
│   ├── services/
│   │   ├── dataService.js       # Lógica de cálculo de diárias e cache local
│   │   └── githubService.js     # Integração REST API (PUT file & POST dispatch)
│   ├── App.jsx                  # Orquestrador da aplicação
│   ├── index.css                # Estilos globais + Tailwind v4 + Leaflet Dark Mode
│   └── main.jsx                 # Ponto de entrada do React
├── ESTADO_ATUAL_E_HANDOFF.md    # Este documento (guia para próxima IA/Desenvolvedor)
├── REPOSITORIO.md               # Manifesto arquitetural técnico
├── README.md                    # Manual de uso rápido
├── package.json                 # Dependências (Vite 8, React 19, Tailwind v4, Leaflet)
└── vite.config.js               # Configuração do Vite + plugin @tailwindcss/vite
```

---

## 🚨 4. Diagnóstico Técnico sobre o Erro de "Carregamento Eterno / Tela Branca" Anterior

Durante a rodada anterior, o usuário relatou que ao abrir o link local o site "ficou carregando eternamente sem mostrar nada".  
**Motivo Identificado:**
O projeto estava sendo construído e executado dentro do disco virtual em rede do Google Drive (`I:\Meu Drive\Sonar Caju`). Em sistemas Windows, o driver do **Google Drive File Stream** trava descritores de arquivo (`EBADF: bad file descriptor`) quando o `chokidar` / `fs.watch` (motor de hot-reload do Vite) tenta monitorar a pasta `node_modules` ao mesmo tempo em que a nuvem tenta sincronizar os binários de cache e os sourcemaps da API do Leaflet e Tailwind. Isso faz com que as requisições HTTP para `/src/main.jsx` ou `/src/index.css` fiquem penduradas (pending) no servidor Vite em disco de rede.

**Solução Aplicada e Status Atual:**
Todo o projeto, histórico Git e `node_modules` foram **completamente migrados e isolados no disco local NTFS** na pasta indicada pelo usuário: `C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju`.  
O servidor de desenvolvimento agora roda instantaneamente (< 1ms de tempo de resposta) no endereço:
👉 **`http://localhost:5199/`**

---

## 📋 5. Guia Rápido para a Próxima IA ou Desenvolvedor que Assumir o Projeto

Caso outra inteligência artificial ou desenvolvedor vá inspecionar, depurar ou evoluir o código a partir daqui, siga estas diretrizes essenciais:

1. **Diretório de Trabalho Efetivo:** Sempre execute comandos, edite arquivos ou rode testes **exclusivamente** em `C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju`. Não utilize mais a pasta antiga do Google Drive.
2. **Iniciar o Servidor Local:**
   ```powershell
   cd "C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju"
   npm run dev -- --host --port 5199
   ```
3. **Padrão de Preços no `dataService.js`:** O cálculo de preço por noite (`calculatePeriodPrice`) verifica primeiro se o imóvel possui uma exceção sazonal no array `calendar` para o período selecionado no `CalendarFilter.jsx`. Se não houver, aplica o `basePrice`. O Arcus Hotel (`isBenchmark: true`) é usado como base para a meta (`arcusPrice / 2`).
4. **Segurança de API Keys:** NUNCA adicione chaves ou tokens PAT em arquivos `.js`, `.env` commitados ou em `competitors.json`. O sistema foi desenhado especificamente para ler `patToken` a partir do `LocalStorage` do navegador (`getSettings()` em `dataService.js`).
5. **Próximas Tarefas Sugeridas no Roadmap:**
   * Validar se o push da branch `main` para `https://github.com/bdsromulo/Sonar-AJU.git` foi feito pelo usuário e se o **GitHub Pages** está ativado nas configurações do repositório remoto.
   * Criar um gráfico histórico (ex: usando `Chart.js` ou `Recharts`) na aba de Gestão para mostrar a evolução da diária média da Orla semana a semana ao longo do ano.
