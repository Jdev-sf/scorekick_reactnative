# 🚀 Edge Function Setup - Sync Matches

## Overview
Implementata una Supabase Edge Function per gestire la sincronizzazione delle partite Serie A lato server, con privilegi database elevati.

## 📁 File Structure
```
supabase/
├── functions/
│   └── sync-matches/
│       ├── index.ts              # Edge Function principale
│       └── _import_map.json      # Import map per Deno
```

## 🔧 Deploy Steps

### 1. Installa Supabase CLI
```bash
npm install -g supabase
```

### 2. Login e Setup
```bash
# Login a Supabase
supabase login

# Link al tuo progetto
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy Edge Function
```bash
# Deploy la function
supabase functions deploy sync-matches

# Oppure con debug
supabase functions deploy sync-matches --debug
```

### 4. Set Environment Variables (Secrets)
Nel dashboard Supabase, vai su **Edge Functions** → **Settings** e configura questi secrets:

**Required Secrets:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FOOTBALL_DATA_API_KEY=your_football_data_api_key_here
```

**⚠️ IMPORTANTE**: Non mettere mai API keys nel codice! Usa sempre environment variables/secrets.

## 🔒 Security & Permissions

### Database Access
- **Service Role**: Bypassa le RLS policies
- **Server-side**: API key nascosta lato server
- **Rate Limiting**: 6 secondi tra chiamate API

### API Security
- **Football-data.org**: API key configurata nell'Edge Function
- **CORS**: Configurato per l'app React Native
- **Authentication**: Non richiesta (sistema interno)

## 🎯 Function Features

### Sync Process
1. **Fetch Matches**: Da Football-data.org API
2. **Transform Data**: Formato API → Database
3. **Upsert Logic**: Update esistenti, Insert nuovi
4. **Rate Limiting**: Rispetta limiti API (10 req/min)
5. **Error Handling**: Raccoglie errori per squadra/partita

### Return Format
```typescript
{
  matchesUpdated: number,
  standingsUpdated: number,
  errors: string[]
}
```

## 📱 Client Integration

### Chiamata dall'App
```typescript
// Hook aggiornato per usare Edge Function
const { mutateAsync } = useSyncData();
await mutateAsync(); // Chiama la Edge Function
```

### Flow Completo
1. **User**: Pull-to-refresh
2. **App**: Chiama Edge Function
3. **Server**: Sync da Football-data.org
4. **Database**: Aggiorna con service role
5. **App**: Invalida cache React Query
6. **UI**: Mostra dati aggiornati

## 🐛 Debugging

### Local Development
```bash
# Avvia Edge Function localmente
supabase functions serve sync-matches

# Test locale
curl -X POST http://localhost:54321/functions/v1/sync-matches
```

### Logs
```bash
# Vedi logs in produzione
supabase functions logs sync-matches
```

### Common Issues
- **API Key**: Verifica environment variables
- **CORS**: Controlla headers nella response
- **Rate Limiting**: Football-data.org 10 req/min
- **Service Role**: Verifica key nel dashboard

## 🚀 Benefits

### vs Client-side Sync
- ✅ **Security**: API keys nascoste
- ✅ **Performance**: Nessun limite RLS
- ✅ **Reliability**: Server-side execution
- ✅ **Scalability**: Un sync per tutti gli utenti

### vs Background Jobs
- ✅ **Simplicity**: No external cron jobs
- ✅ **Integration**: Nativo Supabase
- ✅ **Real-time**: On-demand sync
- ✅ **Control**: User-triggered updates

## 📊 Monitoring

### Success Metrics
- `matchesUpdated`: Partite sincronizzate
- `standingsUpdated`: Posizioni aggiornate
- `errors.length`: Numero errori

### Error Tracking
- API failures
- Database constraint violations
- Network timeouts
- Rate limit exceeded

## 🔄 Maintenance

### Regular Tasks
- Monitor API quota usage
- Check error rates
- Update team names if changed
- Season rollover (August)

### Troubleshooting
1. Check Supabase logs
2. Verify API key status
3. Test database policies
4. Monitor rate limiting