import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import type { PredictionWithMatch } from '../types';

interface PredictionCardProps {
  prediction: PredictionWithMatch;
  onEdit?: () => void;
  showResult?: boolean;
}

export function PredictionCard({ prediction, onEdit, showResult = true }: PredictionCardProps) {
  const { match } = prediction;
  const isCompleted = match.status === 'completed';
  const hasActualScore = match.home_score !== null && match.away_score !== null;

  const getResultColor = () => {
    if (!isCompleted || !hasActualScore || prediction.points_earned === null) {
      return 'text-gray-500';
    }
    
    if (prediction.points_earned === 3) return 'text-green-600';
    if (prediction.points_earned === 1) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getResultText = () => {
    if (!isCompleted || !hasActualScore || prediction.points_earned === null) {
      return 'Pending';
    }
    
    if (prediction.points_earned === 3) return 'Exact!';
    if (prediction.points_earned === 1) return 'Correct Result';
    return 'Wrong';
  };

  const getBorderColor = () => {
    if (!isCompleted || !hasActualScore || prediction.points_earned === null) {
      return 'border-gray-200';
    }
    
    if (prediction.points_earned === 3) return 'border-green-200';
    if (prediction.points_earned === 1) return 'border-yellow-200';
    return 'border-red-200';
  };

  const getBackgroundColor = () => {
    if (!isCompleted || !hasActualScore || prediction.points_earned === null) {
      return 'bg-white';
    }
    
    if (prediction.points_earned === 3) return 'bg-green-50';
    if (prediction.points_earned === 1) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <TouchableOpacity
      onPress={onEdit}
      disabled={!onEdit}
      className={`p-4 rounded-lg border ${getBorderColor()} ${getBackgroundColor()} mb-3`}
    >
      {/* Match header */}
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-sm text-gray-600">Round {match.round}</Text>
          <Text className="text-xs text-gray-500">
            {format(new Date(match.match_date), 'MMM d, HH:mm')}
          </Text>
        </View>
        {showResult && (
          <View className="items-end">
            <Text className={`text-sm font-medium ${getResultColor()}`}>
              {getResultText()}
            </Text>
            {prediction.points_earned !== null && (
              <Text className={`text-xs ${getResultColor()}`}>
                {prediction.points_earned} pts
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Teams and scores */}
      <View className="flex-row items-center justify-between">
        {/* Home team */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-900 mb-1">
            {match.home_team}
          </Text>
          <View className="flex-row items-center space-x-2">
            <View className="w-8 h-8 bg-blue-100 rounded justify-center items-center">
              <Text className="text-sm font-bold text-blue-700">
                {prediction.home_score_predicted}
              </Text>
            </View>
            {hasActualScore && (
              <View className="w-8 h-8 bg-gray-100 rounded justify-center items-center">
                <Text className="text-sm font-bold text-gray-700">
                  {match.home_score}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* VS separator */}
        <View className="px-4">
          <Text className="text-gray-400 font-medium text-xs">VS</Text>
        </View>

        {/* Away team */}
        <View className="flex-1 items-end">
          <Text className="text-sm font-medium text-gray-900 mb-1">
            {match.away_team}
          </Text>
          <View className="flex-row items-center space-x-2">
            {hasActualScore && (
              <View className="w-8 h-8 bg-gray-100 rounded justify-center items-center">
                <Text className="text-sm font-bold text-gray-700">
                  {match.away_score}
                </Text>
              </View>
            )}
            <View className="w-8 h-8 bg-blue-100 rounded justify-center items-center">
              <Text className="text-sm font-bold text-blue-700">
                {prediction.away_score_predicted}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Score legend */}
      {hasActualScore && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row justify-center space-x-6">
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-blue-100 rounded mr-2" />
              <Text className="text-xs text-gray-600">Your Prediction</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-gray-100 rounded mr-2" />
              <Text className="text-xs text-gray-600">Actual Result</Text>
            </View>
          </View>
        </View>
      )}

      {/* Match status */}
      <View className="mt-2">
        <Text className="text-xs text-gray-500 text-center">
          {match.status === 'scheduled' && 'Upcoming'}
          {match.status === 'live' && 'Live'}
          {match.status === 'completed' && 'Completed'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}