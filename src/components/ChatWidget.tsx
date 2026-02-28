import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getChatSessionId,
  saveMessage,
  loadMessages,
  subscribeToMessages,
  checkUserLogin,
  ChatMessage,
  SearchProduct,
} from '@/lib/chatService';
import { supabase } from '@/lib/supabase';
import { sendToGpt, GptMessage } from '@/lib/openaiService';
import SearchResultsGrid from '@/components/SearchResultsGrid';

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  searchResults?: SearchProduct[]; // 검색 결과가 있으면 포함
}

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  text: '안녕하세요! 게미마켓입니다 🎮\n무엇을 도와드릴까요?',
  sender: 'bot',
  timestamp: new Date(),
};

function toDisplayMessage(msg: ChatMessage): DisplayMessage {
  return {
    id: msg.id,
    text: msg.message,
    sender: msg.sender,
    timestamp: new Date(msg.created_at),
  };
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(getChatSessionId());
  const loadedRef = useRef(false);

  // 챗봇 시작 시 로그인 정보 확인
  useEffect(() => {
    checkUserLogin();
  }, []);

  // 채팅 내역 불러오기 (최초 1회)
  const loadChatHistory = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setIsLoading(true);

    const history = await loadMessages(sessionIdRef.current);
    if (history.length > 0) {
      setMessages([WELCOME_MESSAGE, ...history.map(toDisplayMessage)]);
    }
    setIsLoading(false);
  }, []);

  // 채팅창 열릴 때 내역 로드 + 포커스
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, loadChatHistory]);

  // Realtime 구독
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      sessionIdRef.current,
      (newMsg: ChatMessage) => {
        const display = toDisplayMessage(newMsg);
        setMessages((prev) => {
          // 중복 방지
          if (prev.some((m) => m.id === display.id)) return prev;
          return [...prev, display];
        });
      }
    );
    return unsubscribe;
  }, []);

  // 새 메시지 → 스크롤 하단
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setInput('');
    setIsSending(true);

    // 유저 메시지 즉시 표시 (낙관적 업데이트)
    const tempUserMsg: DisplayMessage = {
      id: `temp-user-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Supabase에 유저 메시지 저장
    const savedUser = await saveMessage(sessionIdRef.current, 'user', trimmed);
    if (savedUser) {
      // 임시 → 실제 ID로 교체
      setMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? toDisplayMessage(savedUser) : m))
      );
    }

    // GPT 대화 이력 구성 (최근 메시지를 GptMessage 형식으로 변환)
    const gptHistory: GptMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));
    gptHistory.push({ role: 'user', content: trimmed });

    // GPT-4o-mini 호출 → 실패 시 로컬 폴백
    let botReplyText: string;
    let searchResults: SearchProduct[] | undefined = undefined;
    const gptResponse = await sendToGpt(gptHistory);
    
    // GPT 응답 검증: 기술적인 오류 메시지가 포함되어 있으면 폴백 사용
    if (gptResponse?.reply) {
      const errorKeywords = [
        'Edge Function',
        '배포되지 않았거나',
        'OPENAI_API_KEY',
        'Supabase Dashboard',
        'FunctionsFetchError',
        'Failed to send a request',
      ];
      
      const hasError = errorKeywords.some(keyword => gptResponse.reply.includes(keyword));
      
      if (hasError) {
        console.warn('GPT 응답에 오류 메시지가 포함되어 있습니다. 폴백으로 전환합니다.');
        botReplyText = await getLocalReply(trimmed);
      } else {
        botReplyText = gptResponse.reply;
        searchResults = gptResponse.searchResults; // 검색 결과가 있으면 저장
      }
    } else {
      // GPT 실패 시 기존 로컬 응답으로 폴백
      botReplyText = await getLocalReply(trimmed);
    }

    // Supabase에 봇 응답 저장
    const savedBot = await saveMessage(sessionIdRef.current, 'bot', botReplyText);
    if (savedBot) {
      const displayMsg = toDisplayMessage(savedBot);
      if (searchResults) {
        displayMsg.searchResults = searchResults;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === displayMsg.id)) return prev;
        return [...prev, displayMsg];
      });
    } else {
      const newMsg: DisplayMessage = {
        id: `local-bot-${Date.now()}`,
        text: botReplyText,
        sender: 'bot',
        timestamp: new Date(),
      };
      if (searchResults) {
        newMsg.searchResults = searchResults;
      }
      setMessages((prev) => [...prev, newMsg]);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* 채팅창 */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-80 sm:w-96 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-[600px] sm:h-[700px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">게미마켓 채팅</p>
                <p className="text-xs opacity-80">보통 즉시 응답</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
              aria-label="채팅 닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">채팅 내역 불러오는 중...</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* 텍스트 메시지 */}
                  <div
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-background border border-border text-foreground rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.sender === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* 검색 결과 카드 UI (봇 메시지에 검색 결과가 있을 때) */}
                  {msg.sender === 'bot' && msg.searchResults && msg.searchResults.length > 0 && (
                    <div className="flex justify-start">
                      <div className="w-full max-w-full">
                        <SearchResultsGrid products={msg.searchResults} />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* 봇 타이핑 표시 */}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="flex items-center gap-2 p-3 border-t border-border bg-background">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              disabled={isSending}
              className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || isSending}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0"
              aria-label="메시지 전송"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 플로팅 채팅 버튼 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`fixed bottom-6 right-20 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 md:bottom-8 md:right-24 md:h-14 md:w-14 ${
          isOpen
            ? 'bg-muted-foreground hover:bg-muted-foreground/90'
            : 'bg-primary hover:bg-primary/90 animate-pulse-glow'
        }`}
        aria-label={isOpen ? '채팅 닫기' : '채팅 열기'}
      >
        {isOpen ? (
          <X className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </Button>
    </>
  );
};

// 로컬 폴백 응답 (GPT 실패 시 사용)
async function getLocalReply(userText: string): Promise<string> {
  const text = userText.toLowerCase();

  // "테스트" 입력 시 Supabase에서 상품 목록 조회
  if (text.includes('테스트')) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .order('id', { ascending: true });

      if (error) {
        return '⚠️ 상품 정보를 불러오는 데 실패했습니다.\n잠시 후 다시 시도해주세요.';
      }

      if (!data || data.length === 0) {
        return '현재 등록된 상품이 없습니다.';
      }

      const productList = data
        .map((p) => `🎮 ${p.name}\n   💰 ${p.price.toLocaleString()}원 | 📁 ${p.category}`)
        .join('\n\n');

      return `📦 전체 상품 목록 (${data.length}개)\n\n${productList}`;
    } catch {
      return '⚠️ 서버 연결에 실패했습니다.\n잠시 후 다시 시도해주세요.';
    }
  }

  if (text.includes('안녕') || text.includes('하이') || text.includes('hello')) {
    return '안녕하세요! 😊\n게미마켓에 오신 것을 환영합니다!\n궁금한 점이 있으시면 편하게 물어보세요.';
  }
  if (text.includes('가격') || text.includes('얼마') || text.includes('비용')) {
    return '상품 가격은 각 상품 카드에서 확인하실 수 있습니다.\n특별 할인 정보가 궁금하시면 말씀해주세요! 💰';
  }
  if (text.includes('배송') || text.includes('delivery')) {
    return '디지털 상품은 결제 완료 즉시 이용 가능합니다! ⚡\n별도 배송이 필요하지 않아요.';
  }
  if (text.includes('환불') || text.includes('취소') || text.includes('반품')) {
    return '구매 후 7일 이내, 미사용 상태일 경우 환불이 가능합니다.\n마이페이지에서 환불 요청을 해주세요. 🔄';
  }
  if (text.includes('추천') || text.includes('인기') || text.includes('베스트')) {
    return '현재 가장 인기 있는 게임은\n🥇 더 미라지 크로니클\n🥈 갤럭시 워로드\n🥉 다크니스 던전 3\n입니다!';
  }
  if (text.includes('결제') || text.includes('카드') || text.includes('페이')) {
    return '토스페이먼츠를 통해 안전하게 결제할 수 있습니다.\n카드, 간편결제 등 다양한 수단을 지원합니다! 💳';
  }
  if (text.includes('회원') || text.includes('가입') || text.includes('로그인')) {
    return '오른쪽 상단의 로그인 버튼에서\n회원가입 및 로그인이 가능합니다! 🔑';
  }
  if (text.includes('감사') || text.includes('고마')) {
    return '감사합니다! 😄\n또 궁금한 점이 있으시면 언제든 물어보세요!';
  }

  return '문의해주셔서 감사합니다! 🙏\n해당 내용은 확인 후 안내드리겠습니다.\n\n자주 묻는 질문:\n• 가격/결제\n• 배송\n• 환불/취소\n• 게임 추천\n• "테스트" → 전체 상품 조회';
}

export default ChatWidget;
