export const SCORING_RULES = {
  EXACT_RESULT: 3,
  CORRECT_SIGN: 1,
} as const;

export const SERIE_A_ROUNDS = 38;
export const PREDICTION_DEADLINE_MINUTES = 15;

export const ACHIEVEMENT_TYPES = {
  TOTAL_POINTS: 'total_points',
  EXACT_RESULTS: 'exact_results',
  CONSECUTIVE_ROUNDS: 'consecutive_rounds',
  PERFECT_ROUND: 'perfect_round',
} as const;

export const DEFAULT_ACHIEVEMENTS = [
  {
    name: 'First Goal',
    description: 'Score your first points',
    points_threshold: 1,
    type: ACHIEVEMENT_TYPES.TOTAL_POINTS,
    icon: '⚽',
  },
  {
    name: 'Century',
    description: 'Reach 100 total points',
    points_threshold: 100,
    type: ACHIEVEMENT_TYPES.TOTAL_POINTS,
    icon: '💯',
  },
  {
    name: 'Sharp Shooter',
    description: 'Get 10 exact results',
    points_threshold: 10,
    type: ACHIEVEMENT_TYPES.EXACT_RESULTS,
    icon: '🎯',
  },
  {
    name: 'Perfect Round',
    description: 'Get all predictions correct in a round',
    points_threshold: 1,
    type: ACHIEVEMENT_TYPES.PERFECT_ROUND,
    icon: '🏆',
  },
] as const;