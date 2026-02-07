import { supabase } from './supabase';

export interface GptMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatGptResponse {
  reply: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Supabase Edge Function(chat-gpt)을 통해 GPT-4o-mini에 메시지 전송
 * @param messages 대화 이력 (user/assistant)
 * @returns GPT 응답 텍스트, 실패 시 null
 */
export async function sendToGpt(messages: GptMessage[]): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<ChatGptResponse>('chat-gpt', {
      body: { messages },
    });

    if (error) {
      console.error('GPT Edge Function 호출 실패:', error);
      return null;
    }

    return data?.reply ?? null;
  } catch (err) {
    console.error('GPT 호출 오류:', err);
    return null;
  }
}

