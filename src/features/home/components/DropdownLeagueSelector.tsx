import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import type { League } from '../../leagues/types';

const { width: screenWidth } = Dimensions.get('window');

interface DropdownLeagueSelectorProps {
  leagues: League[];
  selectedLeague?: League | null;
  onLeagueSelect: (league: League) => void;
  userPosition?: number;
  userPoints?: number;
}

export const DropdownLeagueSelector: React.FC<DropdownLeagueSelectorProps> = ({
  leagues,
  selectedLeague,
  onLeagueSelect,
  userPosition,
  userPoints,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectLeague = (league: League) => {
    onLeagueSelect(league);
    setIsOpen(false);
  };

  const renderLeagueItem = ({ item }: { item: League }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        {
          backgroundColor: selectedLeague?.id === item.id ? colors.primary + '20' : colors.surface,
          borderBottomColor: colors.border,
        }
      ]}
      onPress={() => handleSelectLeague(item)}
    >
      <View style={styles.itemContent}>
        <Text style={[
          styles.itemText,
          { 
            color: selectedLeague?.id === item.id ? colors.primary : colors.textPrimary,
            fontWeight: selectedLeague?.id === item.id ? '600' : '500'
          }
        ]}>
          {item.name}
        </Text>
        {selectedLeague?.id === item.id && (
          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
      <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
        Le tue leghe
      </Text>
      
      {/* Main Selector */}
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.background,
            borderColor: colors.primary + '40',
          }
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectorContent}>
          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: colors.textPrimary }]}>
              {selectedLeague?.name || 'Seleziona una lega'}
            </Text>
            {selectedLeague && userPosition && (
              <Text style={[styles.userPosition, { color: colors.textSecondary }]}>
                {userPosition}° posto
              </Text>
            )}
          </View>
          
          <View style={styles.rightSection}>
            {selectedLeague && userPoints && (
              <View style={[styles.pointsBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.pointsText}>{userPoints}</Text>
              </View>
            )}
            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>⋯</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: colors.surface }]}>
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>
                Seleziona Lega
              </Text>
            </View>
            
            <FlatList
              data={leagues}
              renderItem={renderLeagueItem}
              keyExtractor={(item) => item.id}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
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

  selector: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  leagueInfo: {
    alignItems: 'center',
    flex: 1,
  },

  leagueName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  userPosition: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },

  rightSection: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },

  pointsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  menuIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  dropdown: {
    width: screenWidth - 40,
    maxHeight: 400,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  dropdownHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },

  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  dropdownList: {
    maxHeight: 300,
  },

  dropdownItem: {
    borderBottomWidth: 1,
  },

  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  itemText: {
    fontSize: 16,
    flex: 1,
  },

  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
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