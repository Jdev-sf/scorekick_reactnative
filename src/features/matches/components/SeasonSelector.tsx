import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSeasons } from '../hooks/useSeasons';
import type { Season } from '../types';

interface SeasonSelectorProps {
  selectedSeason: Season | null;
  onSeasonSelect: (season: Season | null) => void;
  showCurrentLabel?: boolean;
  disabled?: boolean;
  style?: any;
}

export function SeasonSelector({
  selectedSeason,
  onSeasonSelect,
  showCurrentLabel = true,
  disabled = false,
  style,
}: SeasonSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {
    currentSeason,
    availableSeasons,
    isLoading,
    error,
    getSeasonDisplay,
  } = useSeasons();

  const handleSeasonPress = (season: Season) => {
    onSeasonSelect(season);
    setIsModalVisible(false);
  };

  const handleResetToCurrentSeason = () => {
    onSeasonSelect(currentSeason);
    setIsModalVisible(false);
  };

  const getDisplayText = () => {
    if (isLoading) return 'Caricamento...';
    if (error) return 'Errore';
    if (!selectedSeason) return 'Seleziona stagione';
    
    return getSeasonDisplay(selectedSeason);
  };

  const isCurrentSeasonSelected = selectedSeason?.id === currentSeason?.id;

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento stagioni...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Errore nel caricamento</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          !isCurrentSeasonSelected && styles.selectorHistorical,
          style,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Text 
            style={[
              styles.selectorText,
              disabled && styles.selectorTextDisabled,
              !isCurrentSeasonSelected && styles.selectorTextHistorical,
            ]}
          >
            {getDisplayText()}
          </Text>
          
          {showCurrentLabel && !isCurrentSeasonSelected && (
            <View style={styles.historicalBadge}>
              <Text style={styles.historicalBadgeText}>Storico</Text>
            </View>
          )}
        </View>
        
        <Ionicons
          name="chevron-down"
          size={16}
          color={disabled ? '#C7C7CC' : !isCurrentSeasonSelected ? '#FF9500' : '#007AFF'}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Stagione</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {currentSeason && !isCurrentSeasonSelected && (
              <TouchableOpacity
                style={styles.currentSeasonButton}
                onPress={handleResetToCurrentSeason}
              >
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={styles.currentSeasonButtonText}>
                  Torna alla stagione attuale
                </Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={availableSeasons}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedSeason?.id;
                const isCurrent = item.id === currentSeason?.id;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.seasonItem,
                      isSelected && styles.seasonItemSelected,
                    ]}
                    onPress={() => handleSeasonPress(item)}
                  >
                    <View style={styles.seasonItemContent}>
                      <Text
                        style={[
                          styles.seasonItemText,
                          isSelected && styles.seasonItemTextSelected,
                        ]}
                      >
                        {getSeasonDisplay(item)}
                      </Text>
                      
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Attuale</Text>
                        </View>
                      )}
                    </View>
                    
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.seasonList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  selectorDisabled: {
    backgroundColor: '#F2F2F7',
    opacity: 0.6,
  },
  selectorHistorical: {
    backgroundColor: '#FFF5E6',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  selectorTextDisabled: {
    color: '#C7C7CC',
  },
  selectorTextHistorical: {
    color: '#FF9500',
  },
  historicalBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  historicalBadgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  currentSeasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  currentSeasonButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  seasonList: {
    maxHeight: 400,
  },
  seasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  seasonItemSelected: {
    backgroundColor: '#F2F2F7',
  },
  seasonItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonItemText: {
    fontSize: 16,
    color: '#000',
  },
  seasonItemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  currentBadge: {
    backgroundColor: '#34C759',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
});