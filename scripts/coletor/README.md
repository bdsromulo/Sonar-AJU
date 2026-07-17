# Coletor local — Sonar Caju

Coleta preços reais dos favoritos/benchmark do Airbnb e Booking e faz **append** em
`data/observations.json`. Roda no **PC do Rômulo** com um Chromium real.

> ⚠️ **Nunca rodar em GitHub Actions.** IP de datacenter é bloqueado pelas plataformas.
> Ler página pública de concorrente **não** toca a conta de host do dono — o único risco é
> rate-limit no coletor, por isso o ritmo é humano (4–8s entre consultas).

## Instalação (uma vez)

```powershell
npm i -D playwright
npx playwright install chromium
```

## Uso

```powershell
npm run coletar -- --dry-run          # mostra o plano (imóveis × janelas), não coleta
npm run coletar                       # varredura completa (~57 min, ~574 consultas)
npm run coletar -- --platform booking # só Booking
npm run coletar -- --platform airbnb  # só Airbnb
npm run coletar -- --windows 0-3      # só as 4 primeiras janelas de datas
npm run coletar -- --limit 5          # só os 5 primeiros imóveis (teste)
npm run coletar -- --headful          # com janela do navegador visível
```

**Rodar em partes** (recomendado para não fazer volume grande de uma vez):
divida por plataforma e por faixa de janelas, ex.:
```powershell
npm run coletar -- --platform booking --windows 0-6
npm run coletar -- --platform booking --windows 7-13
npm run coletar -- --platform airbnb  --windows 0-6
```

## O horizonte

Janelas quinzenais de 2 noites (fim de semana), 4 adultos, cobrindo ~6 meses
(≈14 janelas). Ajuste em `generateWindows()` em `extract.mjs`.

## Depois de coletar

O script salva em `data/observations.json` (incremental, com dedupe por consulta/dia).
Revise o `git diff` e commite. O front (aba **Painel & Mapa**) passa a mostrar as novas
janelas automaticamente.
