# Multi-Season Architecture Implementation Guide

## Overview

L'architettura multi-stagione di ScoreKick è ora completamente implementata. Questo documento spiega come utilizzare e integrare il sistema nelle schermate esistenti.

## Componenti Implementati

### 1. Database Schema
- **Tabella `seasons`**: Gestisce le stagioni globali
- **Tabella `league_participations`**: Sostituisce `league_members` con supporto multi-stagione
- **Colonne `season_id`**: Aggiunte a `matches` e `predictions`

### 2. Services
- **`SeasonService`**: CRUD operations per stagioni
- **`footballDataService`**: Aggiornato per supporto dinamico stagioni
- **`matchSyncService`**: Supporta parametri stagione opzionali

### 3. Hooks
- **`useSeasons`**: Hook principale per gestione stagioni
- **`useSeasonContext`**: Context wrapper per accesso globale
- **`useAllSeasons`**, **`useCurrentSeason`**: Hooks specifici per query React Query

### 4. Components
- **`SeasonSelector`**: Component UI per selezione stagioni
- **`SeasonProvider`**: Context provider per stato globale

### 5. Types
- **`Season`**, **`LeagueParticipation`**, **`SeasonContext`**: Interfaces TypeScript

## Come Integrare in una Schermata

### Passo 1: Wrap con SeasonProvider

```tsx
import { SeasonProvider } from '../features/matches/contexts/SeasonContext';

function YourScreen() {
  return (
    <SeasonProvider autoSelectCurrent={true}>
      <YourScreenContent />
    </SeasonProvider>
  );
}
```

### Passo 2: Usa SeasonContext

```tsx
import { useSeasonContext } from '../features/matches/contexts/SeasonContext';
import { SeasonSelector } from '../features/matches/components/SeasonSelector';

function YourScreenContent() {
  const { 
    selectedSeason, 
    selectSeason, 
    isCurrentSeasonSelected 
  } = useSeasonContext();

  return (
    <View>
      <SeasonSelector
        selectedSeason={selectedSeason}
        onSeasonSelect={selectSeason}
      />
      
      {!isCurrentSeasonSelected && (
        <View style={styles.historicalBadge}>
          <Text>Dati storici</Text>
        </View>
      )}
      
      {/* Il resto del tuo componente */}
    </View>
  );
}
```

### Passo 3: Aggiorna Query Hooks

```tsx
// Prima (senza stagioni)
const { data: standings } = useSerieAStandings();

// Dopo (con supporto stagioni)
const { selectedSeason } = useSeasonContext();
const { data: standings } = useSerieAStandings(selectedSeason?.year);
```

## Esempio Completo

Vedi `src/features/matches/components/SerieAStandings.tsx` per un esempio completo di integrazione.

## Patterns di Design

### 1. Auto-Selection
Il sistema seleziona automaticamente la stagione corrente al caricamento.

### 2. Visual Indicators
- Badge "Storico" per stagioni non correnti
- Colori diversi per indicare dati storici vs attuali
- Badge "Attuale" nel selector

### 3. Query Caching
Ogni stagione ha cache separata per performance ottimali.

### 4. Error Handling
Gestione robusta di errori per stagioni non trovate o dati mancanti.

## Best Practices

### 1. Sempre Usa Context
```tsx
// ✅ Corretto
const { selectedSeason } = useSeasonContext();

// ❌ Evitare
const { selectedSeason } = useSeasons(); // Duplica stato
```

### 2. Gestisci Stati Loading
```tsx
const { isLoading, error } = useSeasonContext();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Invalidazione Cache
```tsx
const queryClient = useQueryClient();

// Invalida cache quando cambia stagione
useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ['standings'] });
}, [selectedSeason?.id]);
```

## Migrazione Database

Il migration script `database/multi_season_migration.sql` è già stato eseguito con successo. Include:

- Creazione tabelle `seasons` e `league_participations`
- Migrazione dati esistenti alla stagione corrente "2024-25"
- Aggiunta colonne `season_id` alle tabelle esistenti
- Indici per performance
- Funzioni database aggiornate

## Struttura File

```
src/features/matches/
├── components/
│   ├── SeasonSelector.tsx       # UI component per selezione
│   └── SerieAStandings.tsx      # Esempio integrazione
├── contexts/
│   └── SeasonContext.tsx        # Context provider globale
├── hooks/
│   ├── useSeasons.ts           # Hook principale
│   └── useMatches.ts           # Hooks aggiornati con stagioni
├── services/
│   ├── seasonService.ts        # API calls stagioni
│   ├── footballDataService.ts  # Aggiornato per stagioni
│   └── matchSyncService.ts     # Sync con supporto stagioni
└── types/
    └── index.ts                # Types Season, LeagueParticipation
```

## Testing

Per testare il sistema:

1. **Verifica Database**: Controlla che le tabelle `seasons` e `league_participations` esistano
2. **Test Selector**: Il `SeasonSelector` dovrebbe mostrare "2024-25 (Attuale)"
3. **Test Switching**: Cambiare stagione dovrebbe aggiornare i dati visualizzati
4. **Test Indicatori**: Badge "Storico" dovrebbe apparire per stagioni non correnti

## Prossimi Passi

1. **Rollout Graduale**: Integrare il selector nelle schermate principali
2. **Dati Storici**: Popolare stagioni precedenti se necessario
3. **Performance**: Monitorare performance con dataset multi-stagione
4. **Feature Flag**: Considerare feature flag per attivazione graduale

## Supporto

Per domande o problemi:
- Controlla i logs per errori di query
- Verifica che il `SeasonProvider` wrappe correttamente i componenti
- Assicurati che i hooks siano usati all'interno del context