import React from 'react';
import { View, Text } from 'react-native';
import type { LeagueStatsOverview } from '../types';

interface LeagueStatsOverviewProps {
  stats: LeagueStatsOverview;
}

export function LeagueStatsOverviewComponent({ stats }: LeagueStatsOverviewProps) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-900 mb-4">League Overview</Text>
      
      {/* Main Stats Row */}
      <View className="flex-row justify-between mb-6">
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-blue-600">{stats.total_members}</Text>
          <Text className="text-sm text-gray-600 text-center">Members</Text>
        </View>
        
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-green-600">{stats.completed_rounds}</Text>
          <Text className="text-sm text-gray-600 text-center">Completed Rounds</Text>
        </View>
        
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-purple-600">
            {stats.total_predictions}
          </Text>
          <Text className="text-sm text-gray-600 text-center">Total Predictions</Text>
        </View>
      </View>

      {/* Detailed Stats Grid */}
      <View className="border-t border-gray-100 pt-4">
        <View className="flex-row">
          {/* Points Distribution */}
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-gray-700 mb-3">Points Distribution</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Highest</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.highest_points} pts
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Average</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.average_points.toFixed(1)} pts
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Median</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.median_points} pts
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Lowest</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.lowest_points} pts
                </Text>
              </View>
            </View>
          </View>

          {/* Accuracy Stats */}
          <View className="flex-1 pl-3">
            <Text className="text-sm font-medium text-gray-700 mb-3">Accuracy Stats</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Overall</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.overall_accuracy.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Exact Rate</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.exact_prediction_rate.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Total Exact</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.total_exact_predictions}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600">Active Members</Text>
                <Text className="text-xs font-medium text-gray-900">
                  {stats.active_members}/{stats.total_members}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Progress Bar for Current Round */}
      <View className="mt-4 pt-4 border-t border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700">Season Progress</Text>
          <Text className="text-xs text-gray-600">
            Round {stats.current_round} of 38
          </Text>
        </View>
        
        <View className="w-full bg-gray-200 rounded-full h-2">
          <View 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(stats.current_round / 38) * 100}%` }}
          />
        </View>
        
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs text-gray-500">
            {stats.completed_rounds} completed
          </Text>
          <Text className="text-xs text-gray-500">
            {38 - stats.current_round} remaining
          </Text>
        </View>
      </View>

      {/* Quick Insights */}
      {stats.total_members > 0 && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="text-sm font-medium text-gray-700 mb-2">League Insights</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-600">
              • Average {(stats.total_predictions / Math.max(stats.total_members, 1)).toFixed(1)} predictions per member
            </Text>
            <Text className="text-xs text-gray-600">
              • {stats.active_members} members ({((stats.active_members / stats.total_members) * 100).toFixed(0)}%) actively predicting
            </Text>
            <Text className="text-xs text-gray-600">
              • One in every {stats.total_predictions > 0 ? Math.round(stats.total_predictions / Math.max(stats.total_exact_predictions, 1)) : '∞'} predictions is exact
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}