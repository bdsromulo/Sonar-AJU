# Modelo de Dados — Sonar Caju v2

> Fonte de verdade do modelo. Qualquer código (front, coletores, importador) segue este documento.

## Conceito

A unidade fundamental do sistema é a **observação de preço**: o orçamento que a própria
plataforma (Airbnb/Booking) calculou para uma consulta específica — datas exatas, nº de
hóspedes, pets. Observações são **append-only**: nunca se sobrescrevem, acumulam histórico.

"Temporada" **não existe** no modelo nem na UI. É apenas política de contenção de coleta
(ver playbook ao final).

## Arquivos

| Arquivo | Papel |
|---|---|
| `data/listings.json` | Registro de imóveis (identidade, localização, características) |
| `data/observations.json` | Log append-only de observações de preço |

## `listings.json` — registro de imóveis

Um item por **anúncio por plataforma** (o mesmo imóvel físico no Airbnb e no Booking são
dois itens, agrupados pelo mesmo `propertyKey`).

```jsonc
{
  "id": "abnb-897222574330189303",   // "<abnb|bkng>-<platformId>"
  "platform": "airbnb",              // "airbnb" | "booking"
  "platformId": "897222574330189303", // room id (Airbnb) ou slug (Booking)
  "url": "https://www.airbnb.com.br/rooms/897222574330189303", // URL limpa, sem tracking
  "propertyKey": "minha-hospedagem", // agrupa anúncios do mesmo imóvel físico; null se desconhecido
  "role": "mine",                    // "mine" | "benchmark" | "favorite" | "candidate"
  "name": "Top 3 Qt, todos c/ Ar e TV, a 4 Qd orla",
  "roomType": "Entire home/apt",     // como a plataforma classifica
  "location": {
    "lat": -10.9787,
    "lng": -37.0455,
    "approx": true                   // Airbnb desloca coords de propósito; true até confirmação manual
  },
  "capacity": { "guests": 6, "bedrooms": 3, "beds": null, "baths": 2 },
  "rating": { "avg": 4.94, "count": 31 },
  "petsAllowed": null,               // null = ainda não verificado
  "active": true,                    // false = anúncio saiu do ar / descartado na triagem
  "addedAt": "2026-07-16",
  "metaUpdatedAt": "2026-07-16",
  "notes": ""
}
```

### `role`
- `mine` — a hospedagem do gestor.
- `benchmark` — referência de precificação (Arcus Hotel; regra: meta = 50% da diária dele).
- `favorite` — concorrente direto mapeado pelo gestor.
- `candidate` — capturado em varredura ampla, aguardando triagem (promover a `favorite`
  ou marcar `active: false`).

## `observations.json` — log de observações

```jsonc
{
  "id": "obs-<timestamp>-<rand>",     // gerado pelo importador
  "listingId": "abnb-897222574330189303",
  "query": {                          // exatamente o que foi consultado na plataforma
    "checkin": "2026-12-28",
    "checkout": "2027-01-02",
    "adults": 4,
    "children": 0,
    "infants": 0,
    "pets": 0
  },
  "available": true,                  // false = sem disponibilidade p/ a consulta (É dado!)
  "price": {                          // null se available=false e a plataforma não mostrou preço
    "total": 3500.00,                 // custo total da estadia como exibido ao hóspede
    "nightly": 700.00,                // diária "de vitrine" exibida
    "cleaning": 150.00,               // taxa de limpeza (null se não discriminada)
    "service": 300.00,                // taxa de serviço (null se não discriminada)
    "taxes": 0,
    "currency": "BRL"
  },
  "source": "bookmarklet-listing",    // "bookmarklet-listing" | "bookmarklet-search" | "manual"
  "collectedAt": "2026-07-16T21:40:00-03:00"
}
```

### Regras de comparação
- A métrica comparável entre plataformas é **`total / noites`** (custo total por noite),
  nunca `nightly` — Airbnb e Booking embutem taxas de formas diferentes.
- Comparações só fazem sentido entre observações com **mesma janela de datas** e
  **nº de hóspedes compatível**.
- Frescor: toda exibição de preço no front carrega `collectedAt` ("coletado há X dias").

## Playbook de contenção (a "temporada" operacional)

Coleta é sempre navegação humana real (bookmarklet no Chrome desktop do Rômulo):

| Alvo | Janelas de datas por rodada | Frequência |
|---|---|---|
| Favoritos + benchmark (varredura via busca) | 2–3 janelas representativas | ~1×/semana |
| Mergulho detalhado (página do anúncio) | Arcus + 5–8 favoritos-chave | sob demanda |
| Descoberta ampla | 1–2 janelas | ~1×/mês |

Janelas representativas típicas: próximo fim de semana; semana cheia próxima; feriado mais
próximo; Réveillon. Sem automação de coleta — o sistema apenas **sugere** o que está vencido.

## Legado

`data/competitors.json` e `data/schema.json` são o modelo v1 (basePrice + calendar de
temporadas), mantidos apenas para o front antigo não quebrar até a reescrita. Não evoluir.
