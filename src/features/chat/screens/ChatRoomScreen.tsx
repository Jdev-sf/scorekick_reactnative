import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate 
} from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../services/chatService';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { LazyList } from '../../../components/performance/LazyList';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAnnouncement } from '../../../components/accessibility/AccessibilityAnnouncer';
import { TYPOGRAPHY, SPACING } from '../../../constants/theme';
import type { ChatMessage, ChatRoom, MessageDraft } from '../types';

interface ChatRoomScreenProps {
  room: ChatRoom;
  onUserPress?: (userId: string) => void;
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  room,
  onUserPress,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { 
    getAccessibleFontSize, 
    shouldReduceMotion,
    announceForAccessibility 
  } = useAccessibility();
  const { announce } = useAnnouncement();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const textInputRef = useRef<TextInput>(null);
  const listRef = useRef<any>(null);
  const keyboardHeight = useSharedValue(0);
  const inputHeight = useSharedValue(50);

  // Load messages
  const { 
    data: messages = [], 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage 
  } = useQuery({
    queryKey: ['chatMessages', room.id],
    queryFn: () => ChatService.getRoomMessages(room.id),
    enabled: !!room.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, type, metadata }: {
      content: string;
      type?: ChatMessage['type'];
      metadata?: ChatMessage['metadata'];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return ChatService.sendMessage(
        room.id,
        user.id,
        content,
        type,
        replyToMessage ? { ...metadata, reply_to: replyToMessage.id } : metadata
      );
    },
    onSuccess: (newMessage) => {
      if (newMessage) {
        // Add to query cache
        queryClient.setQueryData(
          ['chatMessages', room.id],
          (old: ChatMessage[] = []) => [...old, newMessage]
        );
        
        // Announce for accessibility
        announce(`Message sent: ${newMessage.content}`, 'low', 500);
        
        // Scroll to bottom
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: !shouldReduceMotion() });
        }, 100);
      }
      
      setMessageText('');
      setReplyToMessage(null);
      ChatService.clearDraft(room.id);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ChatService.editMessage(messageId, user.id, content);
    },
    onSuccess: (updatedMessage) => {
      if (updatedMessage) {
        // Update in query cache
        queryClient.setQueryData(
          ['chatMessages', room.id],
          (old: ChatMessage[] = []) => 
            old.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
        
        announce('Message updated', 'low');
      }
      
      setMessageText('');
      setEditingMessage(null);
    },
    onError: (error) => {
      console.error('Failed to edit message:', error);
      Alert.alert('Error', 'Failed to edit message. Please try again.');
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ChatService.addReaction(messageId, user.id, emoji);
    },
    onSuccess: () => {
      // Refresh messages to get updated reactions
      queryClient.invalidateQueries(['chatMessages', room.id]);
    },
    onError: (error) => {
      console.error('Failed to add reaction:', error);
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ChatService.deleteMessage(messageId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', room.id]);
      announce('Message deleted', 'low');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    }
  });

  // Load draft on mount
  useEffect(() => {
    const draft = ChatService.getDraft(room.id);
    if (draft && !editingMessage && !replyToMessage) {
      setMessageText(draft.content);
      if (draft.reply_to) {
        // Find the reply-to message
        const replyMessage = messages.find(m => m.id === draft.reply_to);
        if (replyMessage) {
          setReplyToMessage(replyMessage);
        }
      }
    }
  }, [room.id, messages, editingMessage, replyToMessage]);

  // Save draft when typing
  useEffect(() => {
    if (messageText && !editingMessage) {
      const timeoutId = setTimeout(() => {
        ChatService.saveDraft(room.id, messageText, replyToMessage?.id);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [messageText, room.id, replyToMessage?.id, editingMessage]);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        keyboardHeight.value = withSpring(event.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeight.value = withSpring(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Real-time message subscription
  useEffect(() => {
    if (!room.id) return;

    const unsubscribe = ChatService.subscribeToRoomMessages(
      room.id,
      (newMessage) => {
        queryClient.setQueryData(
          ['chatMessages', room.id],
          (old: ChatMessage[] = []) => {
            // Avoid duplicates
            if (old.some(msg => msg.id === newMessage.id)) return old;
            return [...old, newMessage];
          }
        );

        // Announce new messages from others
        if (newMessage.user_id !== user?.id) {
          announce(
            `New message from ${newMessage.user?.display_name || newMessage.user?.username}: ${newMessage.content}`,
            'low',
            1000
          );
        }
      },
      () => {
        // Handle reactions
        queryClient.invalidateQueries(['chatMessages', room.id]);
      }
    );

    return unsubscribe;
  }, [room.id, user?.id, queryClient, announce]);

  const handleSendMessage = () => {
    const content = messageText.trim();
    if (!content) return;

    if (editingMessage) {
      editMessageMutation.mutate({
        messageId: editingMessage.id,
        content,
      });
    } else {
      sendMessageMutation.mutate({
        content,
        type: 'text',
      });
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  const handleReply = (message: ChatMessage) => {
    setReplyToMessage(message);
    textInputRef.current?.focus();
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message);
    setMessageText(message.content);
    textInputRef.current?.focus();
  };

  const handleDelete = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMessageMutation.mutate(messageId)
        },
      ]
    );
  };

  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value,
  }));

  const inputStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
  }));

  const renderMessage = ({ item: message }: { item: ChatMessage }) => (
    <ChatMessageBubble
      message={message}
      isOwnMessage={message.user_id === user?.id}
      showUserName={true}
      onReaction={(emoji) => handleReaction(message.id, emoji)}
      onReply={() => handleReply(message)}
      onEdit={() => handleEdit(message)}
      onDelete={() => handleDelete(message.id)}
      onUserPress={onUserPress}
    />
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View 
          className="px-6 py-4 border-b"
          style={{ 
            backgroundColor: colors.surface,
            borderBottomColor: colors.border
          }}
        >
          <Text 
            className="font-bold"
            style={{ 
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.lg
            }}
          >
            {room.name}
          </Text>
          {room.description && (
            <Text 
              className="text-sm mt-1"
              style={{ color: colors.textSecondary }}
            >
              {room.description}
            </Text>
          )}
        </View>

        {/* Messages List */}
        <View className="flex-1">
          <LazyList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            onEndReached={hasNextPage ? fetchNextPage : undefined}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center p-8">
                <Text 
                  className="text-center"
                  style={{ color: colors.textSecondary }}
                >
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
          />
        </View>

        {/* Reply/Edit Indicator */}
        {(replyToMessage || editingMessage) && (
          <View 
            className="px-4 py-2 border-t"
            style={{ 
              backgroundColor: colors.surface,
              borderTopColor: colors.border
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text 
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {editingMessage ? 'Editing message' : `Replying to ${replyToMessage?.user?.display_name || replyToMessage?.user?.username}`}
                </Text>
                <Text 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {editingMessage?.content || replyToMessage?.content}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setReplyToMessage(null);
                  setEditingMessage(null);
                  setMessageText('');
                }}
                className="p-2"
              >
                <Text style={{ color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Input */}
        <Animated.View 
          style={[keyboardStyle]}
          className="border-t"
          style={{ 
            backgroundColor: colors.surface,
            borderTopColor: colors.border
          }}
        >
          <View className="flex-row items-end p-4 space-x-3">
            <View className="flex-1">
              <TextInput
                ref={textInputRef}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={1000}
                className="px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  fontSize: getAccessibleFontSize(TYPOGRAPHY.fontSizes.base),
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxHeight: 100,
                }}
                accessible={true}
                accessibilityLabel="Message input"
                accessibilityHint="Type your message here"
                onContentSizeChange={(event) => {
                  const height = Math.max(50, Math.min(100, event.nativeEvent.contentSize.height + 20));
                  inputHeight.value = withSpring(height);
                }}
              />
            </View>
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending || editMessageMutation.isPending}
              className="p-3 rounded-full"
              style={{ 
                backgroundColor: messageText.trim() ? colors.primary : colors.border
              }}
              accessible={true}
              accessibilityLabel={editingMessage ? "Update message" : "Send message"}
              accessibilityRole="button"
            >
              <Text className="text-white font-bold">
                {editingMessage ? '✓' : '➤'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};