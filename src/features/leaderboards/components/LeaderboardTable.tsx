import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../auth/hooks/useAuth';
import type { LeaderboardEntry } from '../types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  showFullTable?: boolean;
  maxEntries?: number;
  highlightUser?: boolean;
  onUserPress?: (entry: LeaderboardEntry) => void;
}

export function LeaderboardTable({ 
  entries, 
  showFullTable = false, 
  maxEntries = 10,
  highlightUser = true,
  onUserPress 
}: LeaderboardTableProps) {
  const { user } = useAuth();
  
  const displayEntries = showFullTable ? entries : entries.slice(0, maxEntries);
  
  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600'; // Gold
    if (position === 2) return 'text-gray-500'; // Silver
    if (position === 3) return 'text-yellow-700'; // Bronze
    return 'text-gray-600';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}`;
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return user?.id === entry.user_id;
  };

  const getRowStyle = (entry: LeaderboardEntry) => {
    if (highlightUser && isCurrentUser(entry)) {
      return 'bg-blue-50 border border-blue-200';
    }
    return 'bg-white';
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center py-3 px-4 bg-gray-100 border-b border-gray-200">
        <Text className="w-12 text-xs font-medium text-gray-600">Pos</Text>
        <Text className="flex-1 text-xs font-medium text-gray-600">Player</Text>
        <Text className="w-16 text-xs font-medium text-gray-600 text-center">Points</Text>
        <Text className="w-16 text-xs font-medium text-gray-600 text-center">Accuracy</Text>
        <Text className="w-12 text-xs font-medium text-gray-600 text-center">Pred</Text>
      </View>

      {/* Entries */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {displayEntries.map((entry, index) => (
          <TouchableOpacity
            key={entry.user_id}
            onPress={() => onUserPress?.(entry)}
            disabled={!onUserPress}
            className={`flex-row items-center py-3 px-4 border-b border-gray-100 ${getRowStyle(entry)}`}
          >
            {/* Position */}
            <View className="w-12">
              <Text className={`text-sm font-bold ${getPositionColor(entry.position)}`}>
                {entry.position <= 3 ? getPositionIcon(entry.position) : entry.position}
              </Text>
            </View>

            {/* Player Info */}
            <View className="flex-1 mr-2">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                {entry.user_display_name || entry.user_email.split('@')[0]}
              </Text>
              {isCurrentUser(entry) && (
                <Text className="text-xs text-blue-600 font-medium">You</Text>
              )}
            </View>

            {/* Points */}
            <View className="w-16">
              <Text className="text-sm font-bold text-gray-900 text-center">
                {entry.total_points}
              </Text>
              {entry.points_change !== undefined && entry.points_change !== 0 && (
                <Text className={`text-xs text-center ${
                  entry.points_change > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {entry.points_change > 0 ? '+' : ''}{entry.points_change}
                </Text>
              )}
            </View>

            {/* Accuracy */}
            <View className="w-16">
              <Text className="text-sm text-gray-700 text-center">
                {entry.accuracy_percentage.toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-500 text-center">
                {entry.correct_predictions}/{entry.total_predictions}
              </Text>
            </View>

            {/* Predictions Count */}
            <View className="w-12">
              <Text className="text-sm text-gray-700 text-center">
                {entry.total_predictions}
              </Text>
              <Text className="text-xs text-gray-500 text-center">
                {entry.exact_predictions}✓
              </Text>
            </View>

            {/* Position Change Indicator */}
            {entry.position_change !== undefined && entry.position_change !== 0 && (
              <View className="ml-2">
                <Text className={`text-xs ${
                  entry.position_change > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {entry.position_change > 0 ? '↗' : '↘'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Show more button */}
      {!showFullTable && entries.length > maxEntries && (
        <View className="py-3 px-4 bg-gray-50 border-t border-gray-200">
          <Text className="text-sm text-gray-600 text-center">
            Showing {maxEntries} of {entries.length} players
          </Text>
        </View>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <View className="py-8 px-4">
          <Text className="text-gray-500 text-center">
            No predictions yet. Be the first to make a prediction!
          </Text>
        </View>
      )}
    </View>
  );
}