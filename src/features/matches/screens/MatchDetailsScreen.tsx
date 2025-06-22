import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MatchCard } from '../components/MatchCard';
import { Button } from '../../../components/ui/Button';
import type { Match } from '../types';

type RouteParams = {
  match: Match;
  leagueId?: string;
};

export function MatchDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { match, leagueId } = route.params as RouteParams;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPredictionAllowed = () => {
    const now = new Date();
    const matchDate = new Date(match.match_date);
    const deadlineDate = new Date(matchDate.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    return now < deadlineDate && match.status === 'scheduled';
  };

  const handleMakePrediction = () => {
    if (!leagueId) {
      Alert.alert(
        'Seleziona una Lega',
        'Devi selezionare una lega per fare una previsione',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isPredictionAllowed()) {
      Alert.alert(
        'Previsioni Chiuse',
        'Le previsioni per questa partita sono chiuse. Le previsioni si chiudono 15 minuti prima del calcio d\'inizio.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to prediction screen
    // navigation.navigate('MakePrediction', { match, leagueId });
    Alert.alert('In Sviluppo', 'La schermata per fare previsioni sarà disponibile nella prossima fase');
  };

  const renderMatchInfo = () => (
    <View style={styles.matchInfoSection}>
      <Text style={styles.sectionTitle}>Informazioni Partita</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data:</Text>
          <Text style={styles.infoValue}>{formatDate(match.match_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Orario:</Text>
          <Text style={styles.infoValue}>{formatTime(match.match_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giornata:</Text>
          <Text style={styles.infoValue}>{match.round}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Stato:</Text>
          <Text style={[styles.infoValue, { color: getStatusColor(match.status) }]}>
            {getStatusText(match.status)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPredictionSection = () => {
    if (match.status === 'completed') {
      return (
        <View style={styles.predictionSection}>
          <Text style={styles.sectionTitle}>Previsioni</Text>
          <View style={styles.completedCard}>
            <Text style={styles.completedText}>
              Partita terminata. Le previsioni sono state valutate.
            </Text>
            <Button
              title=\"Vedi Previsioni Lega\"
              variant=\"outline\"
              onPress={() => {
                // Navigate to league predictions for this match
                Alert.alert('In Sviluppo', 'Visualizzazione previsioni lega in arrivo');
              }}
            />
          </View>
        </View>
      );
    }

    const canPredict = isPredictionAllowed();
    const deadlineDate = new Date(new Date(match.match_date).getTime() - 15 * 60 * 1000);

    return (
      <View style={styles.predictionSection}>
        <Text style={styles.sectionTitle}>Fai la tua Previsione</Text>
        <View style={styles.predictionCard}>
          {canPredict ? (
            <>
              <Text style={styles.predictionText}>
                Prevedi il risultato di questa partita per guadagnare punti nella tua lega!
              </Text>
              <Text style={styles.deadlineText}>
                Scadenza: {deadlineDate.toLocaleString('it-IT')}
              </Text>
              <Button
                title=\"Fai Previsione\"
                onPress={handleMakePrediction}
                style={styles.predictionButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.closedText}>
                {match.status === 'live' 
                  ? 'Partita in corso - Previsioni chiuse'
                  : 'Previsioni chiuse per questa partita'
                }
              </Text>
              <Text style={styles.deadlineText}>
                Le previsioni si chiudono 15 minuti prima del calcio d'inizio
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#EF4444';
      case 'completed':
        return '#10B981';
      case 'scheduled':
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'In corso';
      case 'completed':
        return 'Terminata';
      case 'scheduled':
      default:
        return 'Programmata';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dettagli Partita</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.matchCardContainer}>
          <MatchCard match={match} />
        </View>

        {renderMatchInfo()}
        {renderPredictionSection()}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiche</Text>
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>
              Le statistiche dettagliate della partita saranno disponibili durante e dopo la partita.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  content: {
    flex: 1,
  },
  matchCardContainer: {
    padding: 16,
  },
  matchInfoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  predictionSection: {
    padding: 16,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  predictionText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  deadlineText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  predictionButton: {
    marginTop: 8,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  closedText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 8,
  },
  statsSection: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});