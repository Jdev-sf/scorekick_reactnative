import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../auth/hooks/useAuth';
import type { RoundLeaderboardEntry } from '../types';

interface RoundLeaderboardProps {
  round: number;
  entries: RoundLeaderboardEntry[];
  totalPredictions: number;
  averagePoints: number;
}

export function RoundLeaderboard({ 
  round, 
  entries, 
  totalPredictions, 
  averagePoints 
}: RoundLeaderboardProps) {
  const { user } = useAuth();

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 bg-yellow-50'; 
    if (position === 2) return 'text-gray-600 bg-gray-50'; 
    if (position === 3) return 'text-yellow-700 bg-yellow-50'; 
    return 'text-gray-600 bg-white';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position.toString();
  };

  const isCurrentUser = (entry: RoundLeaderboardEntry) => {
    return user?.id === entry.user_id;
  };

  const topPerformer = entries[0];
  const userEntry = entries.find(entry => isCurrentUser(entry));

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">Round {round} Results</Text>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-medium text-blue-700">
              {entries.length} participants
            </Text>
          </View>
        </View>
        
        {/* Round Stats */}
        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-sm text-gray-600">Total Predictions</Text>
            <Text className="text-lg font-bold text-gray-900">{totalPredictions}</Text>
          </View>
          <View>
            <Text className="text-sm text-gray-600">Average Points</Text>
            <Text className="text-lg font-bold text-gray-900">{averagePoints.toFixed(1)}</Text>
          </View>
          {topPerformer && (
            <View>
              <Text className="text-sm text-gray-600">Best Performance</Text>
              <Text className="text-lg font-bold text-gray-900">{topPerformer.round_points} pts</Text>
            </View>
          )}
        </View>
      </View>

      {/* User's Performance (if they participated) */}
      {userEntry && (
        <View className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-sm font-medium text-blue-900 mb-2">Your Round {round} Performance</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xl font-bold text-blue-900">{userEntry.round_points}</Text>
              <Text className="text-xs text-blue-700">points</Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-blue-900">#{userEntry.position}</Text>
              <Text className="text-xs text-blue-700">position</Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-blue-900">{userEntry.round_correct}</Text>
              <Text className="text-xs text-blue-700">correct</Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-blue-900">{userEntry.round_exact}</Text>
              <Text className="text-xs text-blue-700">exact</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard Table */}
      <View className="mt-4">
        {/* Table Header */}
        <View className="flex-row items-center py-2 px-4 bg-gray-50 border-b border-gray-200">
          <Text className="w-12 text-xs font-medium text-gray-600">Pos</Text>
          <Text className="flex-1 text-xs font-medium text-gray-600">Player</Text>
          <Text className="w-16 text-xs font-medium text-gray-600 text-center">Points</Text>
          <Text className="w-12 text-xs font-medium text-gray-600 text-center">Correct</Text>
          <Text className="w-12 text-xs font-medium text-gray-600 text-center">Exact</Text>
        </View>

        {/* Table Body */}
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          {entries.map((entry, index) => (
            <View
              key={entry.user_id}
              className={`flex-row items-center py-3 px-4 border-b border-gray-100 ${
                isCurrentUser(entry) ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              {/* Position */}
              <View className="w-12">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${getPositionColor(entry.position)}`}>
                  <Text className={`text-sm font-bold ${entry.position <= 3 ? 'text-yellow-600' : 'text-gray-700'}`}>
                    {entry.position <= 3 ? getPositionIcon(entry.position) : entry.position}
                  </Text>
                </View>
              </View>

              {/* Player Name */}
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                  {entry.user_display_name || `Player ${entry.user_id.slice(0, 8)}`}
                </Text>
                {isCurrentUser(entry) && (
                  <Text className="text-xs text-blue-600 font-medium">You</Text>
                )}
              </View>

              {/* Points */}
              <View className="w-16">
                <Text className="text-sm font-bold text-gray-900 text-center">
                  {entry.round_points}
                </Text>
                {averagePoints > 0 && (
                  <Text className={`text-xs text-center ${
                    entry.round_points > averagePoints ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {entry.round_points > averagePoints ? '+' : ''}{(entry.round_points - averagePoints).toFixed(1)}
                  </Text>
                )}
              </View>

              {/* Correct Predictions */}
              <View className="w-12">
                <Text className="text-sm text-gray-700 text-center">
                  {entry.round_correct}
                </Text>
                <Text className="text-xs text-gray-500 text-center">
                  /{entry.round_predictions}
                </Text>
              </View>

              {/* Exact Predictions */}
              <View className="w-12">
                <Text className="text-sm font-bold text-green-600 text-center">
                  {entry.round_exact}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Empty State */}
      {entries.length === 0 && (
        <View className="py-8 px-4">
          <Text className="text-gray-500 text-center">
            No predictions for Round {round} yet
          </Text>
        </View>
      )}

      {/* Round Insights */}
      {entries.length > 0 && (
        <View className="p-4 border-t border-gray-100 bg-gray-50">
          <Text className="text-sm font-medium text-gray-700 mb-2">Round {round} Insights</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-600">
              • {entries.filter(e => e.round_points > averagePoints).length} players above average
            </Text>
            <Text className="text-xs text-gray-600">
              • {entries.reduce((sum, e) => sum + e.round_exact, 0)} total exact predictions
            </Text>
            <Text className="text-xs text-gray-600">
              • Average accuracy: {totalPredictions > 0 ? ((entries.reduce((sum, e) => sum + e.round_correct, 0) / totalPredictions) * 100).toFixed(0) : 0}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}