# ⚽ ScoreKick - Serie A Matches System Setup

## Overview
The matches system integrates with Football-data.org API to provide real-time Serie A match data, standings, and live score updates.

## 🔧 Setup Instructions

### 1. Football-data.org API Key
✅ **Configuration Required**: Set up API key in environment variables
- **Plan**: Free tier (10 requests/minute limit)  
- **Competition**: Serie A included in free access
- **Rate Limiting**: Automatic 6-second intervals between requests
- **Setup**: Add your API key to `.env` file or Edge Function secrets

> **Security**: API keys should never be hardcoded. Always use environment variables.

### 2. Database Schema
The matches system uses these tables (already in `database/schema.sql`):
- `matches` - Serie A match data
- `serie_a_standings` - Official Serie A standings
- `predictions` - User predictions for matches

### 3. Features Implemented

#### 📅 Match Calendar
- **Component**: `MatchCalendar.tsx`
- **Features**: 
  - Round-by-round navigation (1-38)
  - Match cards with teams, scores, status
  - Real-time status updates (scheduled/live/completed)

#### 🏆 Serie A Standings
- **Component**: `SerieAStandings.tsx`
- **Features**:
  - Official Serie A standings table with real-time position updates
  - Color-coded zones (Champions League, Europa League, Relegation)
  - Comprehensive stats (played, won, drawn, lost, goals, points)
  - Dynamic position changes after each matchday
  - Upsert-based sync to handle position movements correctly

#### ⚽ Match Details
- **Screen**: `MatchDetailsScreen.tsx`
- **Features**:
  - Detailed match information
  - Prediction deadline tracking (15 minutes before kickoff)
  - Match status and live scores

#### 🔄 Data Synchronization
- **Service**: `matchSyncService.ts`
- **Features**:
  - Automatic match data updates
  - Live score synchronization
  - Prediction points calculation
  - League standings updates

## 📱 Navigation Structure

```
Matches Tab
├── MatchesOverview (Calendar + Standings tabs)
└── MatchDetails (Individual match details)
```

## 🔄 Data Flow

### Match Data Sync
1. **API Call**: Football-data.org → `footballDataService.ts`
2. **Transform**: API data → Database format
3. **Store**: Supabase database via `matchSyncService.ts`
4. **Update**: React Query cache invalidation
5. **UI**: Real-time updates in components

### Live Score Updates
- **Frequency**: Every 30 seconds for live matches
- **Trigger**: `useLiveMatches()` hook with `refetchInterval`
- **Process**: Auto-sync → Score update → Prediction recalculation

## 🎯 Prediction Integration

### Points Calculation
- **3 points**: Exact score match
- **1 point**: Correct result (win/draw/loss)
- **0 points**: Wrong prediction

### Deadline System
- **Cutoff**: 15 minutes before kickoff
- **Validation**: Client-side and server-side checks
- **UI**: Automatic disable of prediction forms

## 🚀 Usage Examples

### Auto-sync (Transparent)
```typescript
// Auto-syncs on component mount
const MatchesScreen = () => {
  useEffect(() => {
    // Automatic background sync
  }, []);
};
```

### Pull-to-refresh
```typescript
const handleRefresh = async () => {
  await syncMutation.mutateAsync();
};
```

### Get Live Matches
```typescript
const { data: liveMatches } = useLiveMatches();
```

### Get Matches by Round
```typescript
const { data: matches } = useMatchesByRound(15);
```

### Get Serie A Standings
```typescript
const { data: standings } = useSerieAStandings();
```

## 🔧 Configuration

### API Limits (Free Tier)
- **Rate**: 10 calls/minute (enforced with 6-second intervals)
- **Competitions**: Serie A included in free access
- **Data**: Matches, standings, team info
- **Rate Limiting**: Automatic queue system with delays

### Sync Strategy
- **Auto-sync**: Transparent background sync on app launch
- **Pull-to-refresh**: User can manually refresh data by pulling down
- **Queue**: Requests are queued and processed sequentially with 6s delays
- **Cache-first**: Shows cached data immediately, updates in background
- **Silent errors**: API failures don't interrupt user experience

## 🎨 UI Components

### MatchCard
- Displays team names, scores, status
- Shows user predictions and points earned
- Responsive design with proper spacing

### MatchCalendar
- Round selector with horizontal scroll
- Match list with loading/error states
- Empty states for rounds without matches

### SerieAStandings
- Full standings table with horizontal scroll
- Position indicators with zone colors
- Legend for competition zones

## 🐛 Error Handling

### API Errors
- Rate limiting: Graceful degradation
- Network errors: Retry mechanism
- Invalid data: Validation and fallbacks

### UI States
- Loading: Spinners and skeleton screens
- Errors: User-friendly error messages
- Empty: Helpful empty state messages

## 📊 Performance

### Data Caching
- **React Query**: Automatic caching and invalidation
- **Stale Time**: 2-30 minutes depending on data type
- **Background Updates**: Seamless data refresh

### Optimization
- **Pagination**: Not needed (38 rounds max)
- **Lazy Loading**: Components load on demand
- **Memory**: Efficient data structures

## 🔮 Next Steps (Phase 3B)

The foundation is ready for:
1. **Prediction Forms**: User input for match predictions
2. **Prediction History**: User's past predictions and results
3. **Points Calculation**: Automatic scoring system
4. **League Integration**: Predictions within user leagues

## 🆘 Troubleshooting

### API Key Issues
- Verify key is correct in `.env` file
- Check API quota on football-data.org dashboard
- Ensure environment variable is loaded

### Data Not Loading
- Check internet connection
- Verify Supabase connection
- Check console for error messages
- Try manual sync button

### Live Scores Not Updating
- Verify match status is 'live'
- Check if auto-refetch is enabled
- Test with manual refresh