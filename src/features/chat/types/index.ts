export interface ChatMessage {
  id: string;
  league_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'prediction' | 'achievement' | 'system';
  metadata?: {
    prediction_id?: string;
    achievement_id?: string;
    match_id?: string;
    reply_to?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  is_deleted: boolean;
  
  // Populated relations
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  
  // Reactions
  reactions?: ChatReaction[];
  reactions_count?: Record<string, number>;
  
  // Reply information
  reply_to_message?: ChatMessage;
  replies_count?: number;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  
  // Populated user info
  user?: {
    id: string;
    username: string;
    display_name?: string;
  };
}

export interface ChatRoom {
  id: string;
  league_id: string;
  type: 'general' | 'match' | 'predictions';
  name: string;
  description?: string;
  match_id?: string; // For match-specific chats
  is_active: boolean;
  created_at: string;
  
  // Permissions
  permissions: {
    can_post: 'all' | 'members' | 'admins';
    can_react: 'all' | 'members' | 'admins';
    can_delete_messages: 'author' | 'admins' | 'all';
  };
  
  // Stats
  messages_count: number;
  last_message_at?: string;
  last_message?: ChatMessage;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  is_banned: boolean;
  
  // Populated user info
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

export interface ChatNotification {
  id: string;
  user_id: string;
  room_id: string;
  message_id: string;
  type: 'mention' | 'reply' | 'reaction' | 'new_message';
  is_read: boolean;
  created_at: string;
  
  // Populated relations
  message?: ChatMessage;
  room?: ChatRoom;
}

export interface TypingIndicator {
  user_id: string;
  room_id: string;
  username: string;
  timestamp: number;
}

export interface ChatSettings {
  league_id: string;
  is_enabled: boolean;
  auto_moderation: boolean;
  allowed_message_types: ('text' | 'prediction' | 'achievement')[];
  max_message_length: number;
  rate_limit: {
    messages_per_minute: number;
    enabled: boolean;
  };
  word_filter: {
    enabled: boolean;
    blocked_words: string[];
    action: 'block' | 'warn' | 'auto_moderate';
  };
  notifications: {
    new_messages: boolean;
    mentions: boolean;
    replies: boolean;
  };
}

export interface MessageDraft {
  room_id: string;
  content: string;
  reply_to?: string;
  timestamp: number;
}