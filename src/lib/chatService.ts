import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'bot';
  message: string;
  created_at: string;
}

// 브라우저별 고유 세션 ID 생성/조회
export function getChatSessionId(): string {
  const key = 'gemimarket_chat_session';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// 채팅 메시지 저장
export async function saveMessage(
  sessionId: string,
  sender: 'user' | 'bot',
  message: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ session_id: sessionId, sender, message }])
      .select()
      .single();

    if (error) {
      console.error('채팅 메시지 저장 실패:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('채팅 메시지 저장 오류:', err);
    return null;
  }
}

// 세션의 채팅 내역 불러오기
export async function loadMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('채팅 내역 조회 실패:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('채팅 내역 조회 오류:', err);
    return [];
  }
}

// Supabase Realtime 구독 (새 메시지 실시간 수신)
export function subscribeToMessages(
  sessionId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

