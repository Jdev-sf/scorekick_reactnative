import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useUserPerformanceStats, useRoundLeaderboard } from '../hooks/useLeaderboards';

interface RoundByRoundAnalysisProps {
  leagueId: string;
  currentRound: number;
}

export function RoundByRoundAnalysis({ leagueId, currentRound }: RoundByRoundAnalysisProps) {
  const [selectedRound, setSelectedRound] = useState(currentRound);
  const { data: userStats } = useUserPerformanceStats(leagueId);
  const { data: roundLeaderboard } = useRoundLeaderboard(leagueId, selectedRound);

  // Generate round numbers for selection
  const availableRounds = Array.from({ length: Math.min(currentRound, 38) }, (_, i) => i + 1);

  const getRoundButtonStyle = (round: number) => {
    const isSelected = round === selectedRound;
    const isCurrentRound = round === currentRound;
    
    if (isSelected) {
      return 'bg-blue-600 border-blue-600';
    }
    if (isCurrentRound) {
      return 'bg-green-100 border-green-300';
    }
    return 'bg-gray-100 border-gray-300';
  };

  const getRoundButtonTextStyle = (round: number) => {
    const isSelected = round === selectedRound;
    const isCurrentRound = round === currentRound;
    
    if (isSelected) {
      return 'text-white font-bold';
    }
    if (isCurrentRound) {
      return 'text-green-700 font-medium';
    }
    return 'text-gray-700';
  };

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <View className="p-4 border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">Round-by-Round Analysis</Text>
        <Text className="text-sm text-gray-600 mt-1">
          Track performance across different rounds
        </Text>
      </View>

      {/* Round Selector */}
      <View className="p-4 border-b border-gray-100">
        <Text className="text-sm font-medium text-gray-700 mb-3">Select Round</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {availableRounds.map((round) => (
            <TouchableOpacity
              key={round}
              onPress={() => setSelectedRound(round)}
              className={`px-3 py-2 mr-2 rounded-lg border ${getRoundButtonStyle(round)}`}
            >
              <Text className={`text-sm ${getRoundButtonTextStyle(round)}`}>
                {round}
              </Text>
              {round === currentRound && (
                <Text className="text-xs text-green-600 text-center">Current</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Round Performance Summary */}
      {roundLeaderboard && (
        <View className="p-4 border-b border-gray-100">
          <Text className="text-md font-medium text-gray-900 mb-3">
            Round {selectedRound} Summary
          </Text>
          
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {roundLeaderboard.entries.length}
              </Text>
              <Text className="text-sm text-gray-600">Participants</Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {roundLeaderboard.average_points.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-600">Avg Points</Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {roundLeaderboard.total_predictions}
              </Text>
              <Text className="text-sm text-gray-600">Total Predictions</Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {roundLeaderboard.entries[0]?.round_points || 0}
              </Text>
              <Text className="text-sm text-gray-600">Best Score</Text>
            </View>
          </View>
        </View>
      )}

      {/* User's Round Performance */}
      {userStats && roundLeaderboard && (
        <View className="p-4">
          <Text className="text-md font-medium text-gray-900 mb-3">
            Your Round {selectedRound} Performance
          </Text>
          
          {(() => {
            const userEntry = roundLeaderboard.entries.find(
              entry => entry.user_id === userStats.user_id
            );
            
            if (!userEntry) {
              return (
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-gray-600 text-center">
                    No predictions made for Round {selectedRound}
                  </Text>
                </View>
              );
            }

            const performanceVsAverage = userEntry.round_points - roundLeaderboard.average_points;
            const accuracy = userEntry.round_predictions > 0 
              ? (userEntry.round_correct / userEntry.round_predictions) * 100 
              : 0;

            return (
              <View className="space-y-3">
                {/* Performance Metrics */}
                <View className="flex-row justify-between">
                  <View className="flex-1 bg-blue-50 p-3 rounded-lg mr-2">
                    <Text className="text-xl font-bold text-blue-900">
                      {userEntry.round_points}
                    </Text>
                    <Text className="text-sm text-blue-700">Points Earned</Text>
                    <Text className={`text-xs mt-1 ${
                      performanceVsAverage >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {performanceVsAverage >= 0 ? '+' : ''}{performanceVsAverage.toFixed(1)} vs avg
                    </Text>
                  </View>
                  
                  <View className="flex-1 bg-green-50 p-3 rounded-lg ml-2">
                    <Text className="text-xl font-bold text-green-900">
                      #{userEntry.position}
                    </Text>
                    <Text className="text-sm text-green-700">Position</Text>
                    <Text className="text-xs text-green-600 mt-1">
                      Top {((roundLeaderboard.entries.length - userEntry.position + 1) / roundLeaderboard.entries.length * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {/* Detailed Stats */}
                <View className="bg-gray-50 p-3 rounded-lg">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-gray-600">Predictions Made</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {userEntry.round_predictions}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-gray-600">Correct Predictions</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {userEntry.round_correct} ({accuracy.toFixed(0)}%)
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Exact Scores</Text>
                    <Text className="text-sm font-medium text-green-600">
                      {userEntry.round_exact}
                    </Text>
                  </View>
                </View>

                {/* Round Insights */}
                <View className="bg-yellow-50 p-3 rounded-lg">
                  <Text className="text-sm font-medium text-yellow-800 mb-1">
                    Round {selectedRound} Insights
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-xs text-yellow-700">
                      • You ranked #{userEntry.position} out of {roundLeaderboard.entries.length} participants
                    </Text>
                    <Text className="text-xs text-yellow-700">
                      • Your {userEntry.round_points} points were {Math.abs(performanceVsAverage).toFixed(1)} points {performanceVsAverage >= 0 ? 'above' : 'below'} average
                    </Text>
                    {userEntry.round_exact > 0 && (
                      <Text className="text-xs text-yellow-700">
                        • Great job! You nailed {userEntry.round_exact} exact score{userEntry.round_exact > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}