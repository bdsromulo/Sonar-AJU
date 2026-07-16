# 📡 Sonar Caju — Portal de Inteligência de Concorrência & Aluguéis de Temporada (Orla de Aracaju)

[![React + Vite](https://img.shields.io/badge/React%2019-Vite%208-cyan)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8)](https://tailwindcss.com/)
[![Leaflet Maps](https://img.shields.io/badge/Maps-Leaflet%20Geocoded-10b981)](https://leafletjs.com/)
[![Serverless GitHub API](https://img.shields.io/badge/Architecture-Serverless%20%2B%20Actions-8b5cf6)](REPOSITORIO.md)

O **Sonar Caju** é uma plataforma SPA (Single Page Application) e PWA desenvolvida sob medida para a gestão e precificação estratégica de acomodações de aluguel de temporada (via **Booking.com** e **Airbnb**) localizadas na **Orla de Atalaia / Aracaju - SE**.

---

## 🚀 Como Iniciar o Servidor de Desenvolvimento (Local)

O projeto foi migrado e consolidado na pasta oficial do disco local **`C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju`** para garantir máxima performance sem conflitos de sincronização em nuvem.

Abra o terminal/PowerShell na pasta do projeto e execute:

```powershell
cd "C:\Users\Rômulo Silva\Desktop\Códigos\sonar_aju"
npm run dev -- --host --port 5199
```

Acesse no navegador:  
👉 **`http://localhost:5199/`**

---

## 📚 Documentação Principal no Repositório

Para entender a fundo a arquitetura, o histórico de solicitações e como outra Inteligência Artificial ou desenvolvedor deve dar manutenção ou estender a plataforma, consulte os documentos `.md` incluídos neste repositório:

1. **[ESTADO_ATUAL_E_HANDOFF.md](ESTADO_ATUAL_E_HANDOFF.md)** 📖  
   **Documento de Handoff Oficial**: Contém o resumo completo de todos os requisitos solicitados por Rômulo e seu pai, a explicação da migração para o disco local, a lista de componentes, como acionar o robô de sincronização em nuvem (`sync_prices.yml`), o funcionamento do Bookmarklet sem login (*🧭 Sonar Coletor*) e o checklist de próximos passos.

2. **[REPOSITORIO.md](REPOSITORIO.md)** 🏛️  
   **Manifesto Arquitetural Técnico**: Detalha o desenho da arquitetura Serverless interligada com a API REST do GitHub, a especificação das 3 regras de KPIs (Média Global, Média de Favoritos VIP e a **Regra Arcus Hotel** com alvo em 50% da diária de 2 quartos) e a estrutura dos dados no `schema.json`.

---

## ✨ Principais Destaques do Sistema
* **Mapa Interativo & Pinos Inteligentes**: Visualização geográfica com pinos coloridos por faixa de desvio de preço em relação à média global da Orla.
* **Simulação de Calendário & Sazonalidade**: Alternância rápida entre *Férias de Julho*, *Feriadão da Independência*, *Réveillon* e *Carnaval* com recálculo instantâneo na tela.
* **Sincronização 1-Click (`1-Click Auto Sync`)**: Botão na barra superior que consulta as tarifas diárias atualizadas via nuvem ou localmente e faz o commit automático no repositório.
* **Zero Risco de Bloqueio**: Sistema 100% sem necessidade de login ou exposição da conta da acomodação nas plataformas.

---
*Desenvolvido para a Orla de Aracaju / SE &bull; Repositório Alvo:* `https://github.com/bdsromulo/Sonar-AJU.git`
