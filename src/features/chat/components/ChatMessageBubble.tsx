import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence 
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { TYPOGRAPHY, SPACING } from '../../../constants/theme';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showUserName?: boolean;
  onReaction?: (emoji: string) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUserPress?: (userId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isOwnMessage,
  showUserName = true,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onUserPress,
}) => {
  const { colors } = useTheme();
  const { getSemanticDescription, shouldReduceMotion } = useAccessibility();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleLongPress = () => {
    if (!shouldReduceMotion()) {
      scale.value = withSequence(
        withSpring(0.98, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
    setShowActions(true);
  };

  const handleReactionPress = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji);
      setShowReactions(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getMessageTypeIcon = () => {
    switch (message.type) {
      case 'prediction': return '🎯';
      case 'achievement': return '🏆';
      case 'system': return '🤖';
      default: return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const commonReactions = ['👍', '👎', '😂', '❤️', '😮', '😢'];

  const semanticDescription = getSemanticDescription('prediction', {
    user: message.user?.display_name || message.user?.username,
    content: message.content,
    timestamp: formatTimestamp(message.created_at),
    type: message.type,
  });

  return (
    <TouchableWithoutFeedback onPress={() => setShowActions(false)}>
      <View className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* User name and timestamp */}
        {showUserName && message.user && (
          <TouchableOpacity
            onPress={() => onUserPress?.(message.user!.id)}
            className="mb-1 px-3"
          >
            <Text 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              {message.user.display_name || message.user.username} • {formatTimestamp(message.created_at)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reply indicator */}
        {message.reply_to_message && (
          <View 
            className={`mb-2 mx-3 p-2 rounded-lg border-l-4 ${
              isOwnMessage ? 'bg-blue-50' : 'bg-gray-50'
            }`}
            style={{ 
              borderLeftColor: colors.primary,
              backgroundColor: colors.surface + '80'
            }}
          >
            <Text 
              className="text-xs font-medium mb-1"
              style={{ color: colors.primary }}
            >
              Reply to {message.reply_to_message.user?.display_name || message.reply_to_message.user?.username}
            </Text>
            <Text 
              className="text-xs"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {message.reply_to_message.content}
            </Text>
          </View>
        )}

        {/* Message bubble */}
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={semanticDescription}
            accessibilityRole="text"
            accessibilityHint={isOwnMessage ? "Your message. Long press for options." : "Message from another user. Long press for options."}
          >
            <View
              className={`
                px-4 py-3 rounded-2xl max-w-xs relative
                ${isOwnMessage 
                  ? 'bg-blue-500 rounded-br-sm' 
                  : 'bg-gray-100 rounded-bl-sm'
                }
              `}
              style={{
                backgroundColor: isOwnMessage 
                  ? colors.primary 
                  : colors.surface,
                maxWidth: '80%',
              }}
            >
              {/* Message type indicator */}
              {message.type !== 'text' && (
                <View className="flex-row items-center mb-2">
                  <Text className="text-xs mr-2">{getMessageTypeIcon()}</Text>
                  <Text 
                    className="text-xs font-medium capitalize"
                    style={{ 
                      color: isOwnMessage ? 'rgba(255,255,255,0.8)' : colors.textSecondary 
                    }}
                  >
                    {message.type}
                  </Text>
                </View>
              )}

              {/* Message content */}
              <Text
                style={{
                  color: isOwnMessage ? '#FFFFFF' : colors.textPrimary,
                  fontSize: TYPOGRAPHY.fontSizes.base,
                  lineHeight: TYPOGRAPHY.fontSizes.base * 1.4,
                }}
              >
                {message.content}
              </Text>

              {/* Edited indicator */}
              {message.is_edited && (
                <Text 
                  className="text-xs mt-1 italic"
                  style={{ 
                    color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary 
                  }}
                >
                  (edited)
                </Text>
              )}

              {/* Message status indicator for own messages */}
              {isOwnMessage && (
                <View className="absolute -bottom-1 -right-1">
                  <Text className="text-xs">✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Reactions */}
          {message.reactions_count && Object.keys(message.reactions_count).length > 0 && (
            <View className="flex-row flex-wrap mt-1 px-2">
              {Object.entries(message.reactions_count).map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReactionPress(emoji)}
                  className="flex-row items-center bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className="text-sm mr-1">{emoji}</Text>
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Message Actions */}
        {showActions && (
          <View 
            className={`
              flex-row mt-2 p-2 rounded-lg shadow-lg
              ${isOwnMessage ? 'bg-blue-50' : 'bg-gray-50'}
            `}
            style={{ backgroundColor: colors.surface }}
          >
            {/* Reaction button */}
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              className="p-2 rounded-full mr-2"
              style={{ backgroundColor: colors.background }}
            >
              <Text className="text-lg">😊</Text>
            </TouchableOpacity>

            {/* Reply button */}
            {onReply && (
              <TouchableOpacity
                onPress={() => {
                  onReply();
                  setShowActions(false);
                }}
                className="p-2 rounded-full mr-2"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-lg">💬</Text>
              </TouchableOpacity>
            )}

            {/* Edit button (own messages only) */}
            {isOwnMessage && onEdit && (
              <TouchableOpacity
                onPress={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="p-2 rounded-full mr-2"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-lg">✏️</Text>
              </TouchableOpacity>
            )}

            {/* Delete button (own messages only) */}
            {isOwnMessage && onDelete && (
              <TouchableOpacity
                onPress={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="p-2 rounded-full"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-lg">🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <View 
            className="flex-row mt-2 p-2 rounded-lg shadow-lg"
            style={{ backgroundColor: colors.surface }}
          >
            {commonReactions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReactionPress(emoji)}
                className="p-2 rounded-full mr-1"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};