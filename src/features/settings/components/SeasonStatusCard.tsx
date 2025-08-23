import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { SeasonService } from '../../matches/services/seasonService';
import { EdgeFunctionService } from '../../matches/services/edgeFunctionService';
import { useSeasons } from '../../matches/hooks/useSeasons';

export const SeasonStatusCard: React.FC = () => {
  const { colors } = useTheme();
  const { currentSeason, availableSeasons, refetchSeasons } = useSeasons();
  const [currentSeasonString, setCurrentSeasonString] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load current season string dynamically
  useEffect(() => {
    const loadCurrentSeason = async () => {
      try {
        setIsLoading(true);
        const seasonString = await SeasonService.getCurrentSeasonString();
        setCurrentSeasonString(seasonString);
      } catch (error) {
        console.error('Error loading current season:', error);
        // Fallback to date-based detection
        const fallback = SeasonService.getCurrentSeasonStringFallback();
        setCurrentSeasonString(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentSeason();
  }, [currentSeason]); // Re-run when currentSeason changes

  const isCurrentSeasonActive = currentSeason?.year === currentSeasonString;

  const handleSyncData = async () => {
    try {
      Alert.alert(
        'Sincronizza Dati',
        'Questo aggiornerà i dati delle partite dalla nuova stagione. Continuare?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Sincronizza',
            onPress: async () => {
              try {
                await EdgeFunctionService.syncAllData();
                await refetchSeasons();
                // Refresh current season string after sync
                const seasonString = await SeasonService.getCurrentSeasonString();
                setCurrentSeasonString(seasonString);
                Alert.alert('Successo', 'Dati sincronizzati con successo!');
              } catch (error) {
                console.error('Sync error:', error);
                Alert.alert('Errore', 'Errore durante la sincronizzazione');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Errore', 'Impossibile avviare la sincronizzazione');
    }
  };

  const getSeasonStatus = () => {
    if (!currentSeason) {
      return {
        status: 'Nessuna stagione attiva',
        color: colors.error,
        icon: 'warning' as const,
        description: 'Sincronizza i dati per creare la stagione corrente'
      };
    }
    
    if (isCurrentSeasonActive) {
      return {
        status: 'Stagione Attiva',
        color: colors.success,
        icon: 'checkmark-circle' as const,
        description: `Stagione ${currentSeason.year} è attiva`
      };
    }
    
    return {
      status: 'Stagione Non Aggiornata',
      color: colors.warning,
      icon: 'time' as const,
      description: `Database: ${currentSeason.year}, Attuale: ${currentSeasonString}`
    };
  };

  const statusInfo = getSeasonStatus();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: statusInfo.color,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
            marginLeft: 8,
          }}
        >
          {statusInfo.status}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 12,
        }}
      >
        {statusInfo.description}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            Stagione Corrente (Rilevata)
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {isLoading ? 'Caricamento...' : currentSeasonString}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            Database
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {currentSeason?.year || 'Non disponibile'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSyncData}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 8,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="sync" size={16} color="#FFFFFF" />
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '600',
            marginLeft: 8,
          }}
        >
          Sincronizza Dati Stagione
        </Text>
      </TouchableOpacity>

      {availableSeasons.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textTertiary,
              marginBottom: 4,
            }}
          >
            Stagioni Disponibili ({availableSeasons.length})
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {availableSeasons.slice(0, 4).map((season) => (
              <View
                key={season.id}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 8,
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {season.year}
                  {season.is_active && ' (Attiva)'}
                </Text>
              </View>
            ))}
            {availableSeasons.length > 4 && (
              <Text style={{ fontSize: 12, color: colors.textTertiary, alignSelf: 'center' }}>
                +{availableSeasons.length - 4} altre
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};