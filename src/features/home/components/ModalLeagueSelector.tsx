import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import type { League } from '../../leagues/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalLeagueSelectorProps {
  leagues: League[];
  selectedLeague?: League | null;
  onLeagueSelect: (league: League) => void;
  userPosition?: number;
  userPoints?: number;
}

export const ModalLeagueSelector: React.FC<ModalLeagueSelectorProps> = ({
  leagues,
  selectedLeague,
  onLeagueSelect,
  userPosition,
  userPoints,
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectLeague = (league: League) => {
    onLeagueSelect(league);
    setIsModalVisible(false);
  };

  const renderLeagueCard = ({ item }: { item: League }) => {
    const isSelected = selectedLeague?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.leagueCard,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => handleSelectLeague(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={[
            styles.leagueName,
            { color: isSelected ? '#FFFFFF' : colors.textPrimary }
          ]}>
            {item.name}
          </Text>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={[
            styles.cardDescription,
            { color: isSelected ? '#FFFFFF' + 'CC' : colors.textSecondary }
          ]}>
            Tap per selezionare questa lega
          </Text>
          
          {isSelected && userPosition && (
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: '#FFFFFF' + 'DD' }]}>
                {userPosition}° posto
              </Text>
              {userPoints && (
                <Text style={[styles.statText, { color: '#FFFFFF' + 'DD' }]}>
                  • {userPoints} punti
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (leagues.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nessuna lega disponibile
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Le tue leghe
      </Text>
      
      {/* Main Trigger Button */}
      <TouchableOpacity
        style={[
          styles.triggerButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          <View style={styles.leagueInfo}>
            <Text style={[styles.selectedLeagueName, { color: colors.textPrimary }]}>
              {selectedLeague?.name || 'Seleziona una lega'}
            </Text>
            {selectedLeague && userPosition && (
              <Text style={[styles.selectedUserInfo, { color: colors.textSecondary }]}>
                {userPosition}° posto{userPoints ? ` • ${userPoints} punti` : ''}
              </Text>
            )}
          </View>
          
          <View style={styles.buttonRight}>
            <Text style={[styles.changeText, { color: colors.primary }]}>Cambia</Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>▶</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Full Screen Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Seleziona Lega
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Leagues List */}
          <FlatList
            data={leagues}
            renderItem={renderLeagueCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
          
          {/* Modal Footer */}
          <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                Annulla
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },

  triggerButton: {
    width: screenWidth - 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leagueInfo: {
    flex: 1,
  },

  selectedLeagueName: {
    fontSize: 16,
    fontWeight: '600',
  },

  selectedUserInfo: {
    fontSize: 12,
    marginTop: 2,
  },

  buttonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  chevron: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalList: {
    padding: 20,
    paddingBottom: 100,
  },

  leagueCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  leagueName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },

  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  cardFooter: {
    gap: 8,
  },

  cardDescription: {
    fontSize: 14,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  statText: {
    fontSize: 13,
    fontWeight: '500',
  },

  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },

  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    borderStyle: 'dashed',
  },

  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});