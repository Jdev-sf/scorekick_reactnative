import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { format, addMinutes } from 'date-fns';
import { 
  useUserPrediction, 
  useCreatePrediction, 
  useUpdatePrediction, 
  useDeletePrediction,
  usePredictionDeadlineCheck 
} from '../hooks/usePredictions';
import type { Match } from '../../matches/types';

interface PredictionFormProps {
  match: Match;
  leagueId: string;
  onSuccess?: () => void;
}

export function PredictionForm({ match, leagueId, onSuccess }: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get existing prediction
  const { data: existingPrediction, isLoading: isPredictionLoading } = useUserPrediction(match.id, leagueId);
  
  // Check deadline
  const { data: deadlineCheck, isLoading: isDeadlineLoading } = usePredictionDeadlineCheck(match.id);
  
  // Mutations
  const createPrediction = useCreatePrediction();
  const updatePrediction = useUpdatePrediction();
  const deletePrediction = useDeletePrediction();

  // Set form values from existing prediction
  useEffect(() => {
    if (existingPrediction) {
      setHomeScore(existingPrediction.home_score_predicted.toString());
      setAwayScore(existingPrediction.away_score_predicted.toString());
    }
  }, [existingPrediction]);

  const handleSubmit = async () => {
    if (!deadlineCheck?.allowed) {
      Alert.alert('Prediction Deadline', deadlineCheck?.reason || 'Predictions are no longer allowed for this match');
      return;
    }

    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      Alert.alert('Invalid Score', 'Please enter valid scores (0 or greater)');
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingPrediction) {
        // Update existing prediction
        await updatePrediction.mutateAsync({
          predictionId: existingPrediction.id,
          update: {
            home_score_predicted: homeScoreNum,
            away_score_predicted: awayScoreNum,
          },
        });
        Alert.alert('Success', 'Your prediction has been updated!');
      } else {
        // Create new prediction
        await createPrediction.mutateAsync({
          match_id: match.id,
          league_id: leagueId,
          home_score_predicted: homeScoreNum,
          away_score_predicted: awayScoreNum,
        });
        Alert.alert('Success', 'Your prediction has been saved!');
      }
      
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to save prediction'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!existingPrediction) return;

    Alert.alert(
      'Delete Prediction',
      'Are you sure you want to delete your prediction for this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePrediction.mutateAsync(existingPrediction.id);
              setHomeScore('');
              setAwayScore('');
              Alert.alert('Success', 'Your prediction has been deleted');
              onSuccess?.();
            } catch (error) {
              Alert.alert(
                'Error', 
                error instanceof Error ? error.message : 'Failed to delete prediction'
              );
            }
          },
        },
      ]
    );
  };

  if (isPredictionLoading || isDeadlineLoading) {
    return (
      <View className="p-4 bg-white rounded-lg shadow-sm">
        <Text className="text-gray-500 text-center">Loading prediction form...</Text>
      </View>
    );
  }

  if (!deadlineCheck?.allowed) {
    const deadline = new Date(match.match_date);
    const deadlineTime = addMinutes(deadline, -15);
    
    return (
      <View className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Text className="text-red-600 font-medium text-center mb-2">
          Prediction Deadline Passed
        </Text>
        <Text className="text-gray-600 text-sm text-center">
          Predictions were due by {format(deadlineTime, 'HH:mm')} on {format(deadlineTime, 'MMM d')}
        </Text>
        <Text className="text-gray-500 text-xs text-center mt-1">
          {deadlineCheck.reason}
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">
          Make Your Prediction
        </Text>
        {existingPrediction && (
          <Text className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Prediction Saved
          </Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">
          Deadline: {format(addMinutes(new Date(match.match_date), -15), 'HH:mm, MMM d')}
        </Text>
      </View>

      {/* Match teams and score inputs */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Home team */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-2 text-center">
            {match.home_team}
          </Text>
          <TextInput
            value={homeScore}
            onChangeText={setHomeScore}
            placeholder="0"
            keyboardType="numeric"
            maxLength={2}
            className="w-16 h-12 mx-auto text-center text-xl font-bold border border-gray-300 rounded-lg bg-white"
            editable={!isSubmitting}
          />
        </View>

        {/* VS separator */}
        <View className="px-4">
          <Text className="text-gray-400 font-medium">VS</Text>
        </View>

        {/* Away team */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-2 text-center">
            {match.away_team}
          </Text>
          <TextInput
            value={awayScore}
            onChangeText={setAwayScore}
            placeholder="0"
            keyboardType="numeric"
            maxLength={2}
            className="w-16 h-12 mx-auto text-center text-xl font-bold border border-gray-300 rounded-lg bg-white"
            editable={!isSubmitting}
          />
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !homeScore || !awayScore}
          className={`flex-1 py-3 px-4 rounded-lg ${
            isSubmitting || !homeScore || !awayScore
              ? 'bg-gray-300'
              : 'bg-blue-600'
          }`}
        >
          <Text className={`text-center font-medium ${
            isSubmitting || !homeScore || !awayScore
              ? 'text-gray-500'
              : 'text-white'
          }`}>
            {isSubmitting 
              ? 'Saving...' 
              : existingPrediction 
                ? 'Update Prediction' 
                : 'Save Prediction'
            }
          </Text>
        </TouchableOpacity>

        {existingPrediction && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isSubmitting}
            className="px-4 py-3 border border-red-300 rounded-lg"
          >
            <Text className="text-red-600 font-medium">Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Points info */}
      <View className="mt-4 p-3 bg-blue-50 rounded-lg">
        <Text className="text-xs text-blue-700 font-medium mb-1">Scoring System:</Text>
        <Text className="text-xs text-blue-600">
          • Exact score: 3 points{'\n'}
          • Correct result (win/draw/loss): 1 point{'\n'}
          • Wrong result: 0 points
        </Text>
      </View>
    </View>
  );
}