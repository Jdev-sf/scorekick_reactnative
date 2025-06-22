import React from 'react';
import { View, Text } from 'react-native';
import type { UserPerformanceStats } from '../types';

interface UserStatsCardProps {
  stats: UserPerformanceStats;
  compactMode?: boolean;
}

export function UserStatsCard({ stats, compactMode = false }: UserStatsCardProps) {
  const formatPercentile = (percentile: number) => {
    if (percentile >= 90) return { text: 'Top 10%', color: 'text-green-600' };
    if (percentile >= 75) return { text: 'Top 25%', color: 'text-blue-600' };
    if (percentile >= 50) return { text: 'Top 50%', color: 'text-yellow-600' };
    return { text: 'Bottom 50%', color: 'text-gray-600' };
  };

  const percentileInfo = formatPercentile(stats.position_percentile);

  if (compactMode) {
    return (
      <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">Your Stats</Text>
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-sm font-medium text-blue-700">
              #{stats.current_position}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{stats.total_points}</Text>
            <Text className="text-sm text-gray-600">Total Points</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {stats.accuracy_percentage.toFixed(0)}%
            </Text>
            <Text className="text-sm text-gray-600">Accuracy</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{stats.exact_predictions}</Text>
            <Text className="text-sm text-gray-600">Exact Scores</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">Your Performance</Text>
          <View className="flex-row items-center space-x-2">
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-blue-700">
                Position #{stats.current_position}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              percentileInfo.color.includes('green') ? 'bg-green-100' :
              percentileInfo.color.includes('blue') ? 'bg-blue-100' :
              percentileInfo.color.includes('yellow') ? 'bg-yellow-100' :
              'bg-gray-100'
            }`}>
              <Text className={`text-sm font-medium ${percentileInfo.color}`}>
                {percentileInfo.text}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Stats */}
      <View className="p-4">
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 items-center">
            <Text className="text-3xl font-bold text-gray-900">{stats.total_points}</Text>
            <Text className="text-sm text-gray-600 mt-1">Total Points</Text>
            {stats.points_above_average !== 0 && (
              <Text className={`text-xs mt-1 ${
                stats.points_above_average > 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {stats.points_above_average > 0 ? '+' : ''}{stats.points_above_average.toFixed(1)} vs avg
              </Text>
            )}
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-3xl font-bold text-gray-900">
              {stats.accuracy_percentage.toFixed(0)}%
            </Text>
            <Text className="text-sm text-gray-600 mt-1">Accuracy</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {stats.correct_predictions}/{stats.total_predictions} correct
            </Text>
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-3xl font-bold text-gray-900">{stats.exact_predictions}</Text>
            <Text className="text-sm text-gray-600 mt-1">Exact Scores</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {stats.total_predictions > 0 ? 
                ((stats.exact_predictions / stats.total_predictions) * 100).toFixed(0) : 0}% rate
            </Text>
          </View>
        </View>

        {/* Detailed Stats Grid */}
        <View className="border-t border-gray-100 pt-4">
          <View className="flex-row flex-wrap">
            {/* Round Performance */}
            <View className="w-1/2 mb-4 pr-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">Round Performance</Text>
              <View className="space-y-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Best Round</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.best_round_points} pts
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Average</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.average_round_points.toFixed(1)} pts
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Rounds</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.rounds_participated}
                  </Text>
                </View>
              </View>
            </View>

            {/* Streaks */}
            <View className="w-1/2 mb-4 pl-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">Streaks</Text>
              <View className="space-y-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Current Correct</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.current_correct_streak}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Best Correct</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.best_correct_streak}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Best Exact</Text>
                  <Text className="text-xs font-medium text-gray-900">
                    {stats.best_exact_streak}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}