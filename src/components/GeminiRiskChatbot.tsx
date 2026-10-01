import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Trash2, ArrowDownCircle, ShieldCheck, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { BotInstance } from '../types/trading';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface GeminiRiskChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  bots: BotInstance[];
  activeBot: BotInstance;
  totalDailyExposure: number;
  currentDrawdownPct: number;
  portfolioPnl: number;
}

export const GeminiRiskChatbot: React.FC<GeminiRiskChatbotProps> = ({
  isOpen,
  onClose,
  bots,
  activeBot,
  totalDailyExposure,
  currentDrawdownPct,
  portfolioPnl,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content: `Olá! Sou o **QuantAI Risk Copilot**, seu Engenheiro Quantitativo Sênior e Chief Risk Officer (CRO).\n\nEstou monitorando seu portfólio de **${bots.length} robôs** no MetaTrader 5 e Binance:\n- **Exposição Diária:** R$ ${totalDailyExposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n- **Drawdown Atual:** ${currentDrawdownPct.toFixed(2)}%\n- **PnL Consolidado Hoje:** ${portfolioPnl >= 0 ? '+' : ''}R$ ${portfolioPnl.toFixed(2)}\n\nComo posso ajudar você a otimizar sua gestão de risco, limites de perda ou dimensionamento de posição hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  const quickPrompts = [
    'Qual o nível de risco atual da minha carteira?',
    'Como calcular o tamanho ótimo de lote pelo Critério de Kelly?',
    'Analise o Drawdown atual e recomende travas de proteção',
    'Como proteger as operações contra alta volatilidade no payroll/notícias?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Build context summary to pass along with conversation history
    const contextPrompt = `
[CONTEXTO ATUAL DO PORTFÓLIO]
- Robô Ativo Selecionado: ${activeBot.name} (${activeBot.symbol}, Timeframe ${activeBot.timeframe}, Lotes: ${activeBot.lots}, SL: ${activeBot.stopLossPoints}, TP: ${activeBot.takeProfitPoints})
- Total de Robôs Cadastrados: ${bots.length} (${bots.filter((b) => b.status === 'RUNNING').length} em execução)
- Exposição Diária Consolidada: R$ ${totalDailyExposure.toFixed(2)}
- Drawdown Atual da Carteira: ${currentDrawdownPct.toFixed(2)}%
- Resultado Consolidado Hoje: R$ ${portfolioPnl.toFixed(2)}
- Detalhes dos Robôs no Portfólio:
${bots.map((b) => `  * [${b.status}] ${b.name} (${b.symbol}): PnL Hoje R$ ${b.stats.todayPnl.toFixed(2)}, WinRate ${b.stats.winRate}%, Limite Diário R$ ${b.maxDailyLoss}`).join('\n')}
`;

    // Messages history formatted for multi-turn chat
    const conversationPayload = [
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content: `${userMessage.content}\n\n${contextPrompt}`,
      },
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationPayload,
          systemInstruction: `Você é o "QuantAI Risk Copilot", Engenheiro Quantitativo Sênior e Diretor de Risco (Chief Risk Officer - CRO) especialista em algoritmos quantitativos no MetaTrader 5 e Binance Futures.
Forneça respostas estruturadas, analíticas e com embasamento matemático financeiro em Português do Brasil. Use tópicos com marcadores, formatação em negrito para termos-chave e fórmulas quando pertinente. Seja encorajador, prudente e priorize a preservação do capital.`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const modelReply = data.reply || 'Desculpe, não consegui gerar uma resposta.';

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: modelReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('[Gemini Chatbot Error]:', err);
      setError(err?.message || 'Falha ao conectar com o serviço do Gemini.');
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Aviso de Comunicação:** Não foi possível obter resposta no momento (${err?.message || 'Erro de rede'}). Verifique a chave de API ou tente novamente.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: 'Histórico de conversa reiniciado. Como posso orientar sua gestão de risco agora?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg h-full bg-[#0b0f19] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">QuantAI Risk Copilot</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Chief Risk Officer & Estrategista Quantitativo</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Limpar Histórico de Mensagens"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Banner */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Drawdown: <strong className="text-slate-200">{currentDrawdownPct.toFixed(2)}%</strong></span>
            <span>·</span>
            <span>Exposição: <strong className="text-slate-200">R$ {totalDailyExposure.toLocaleString('pt-BR')}</strong></span>
          </div>
          <span className="text-emerald-400 font-semibold">{portfolioPnl >= 0 ? '+' : ''}R$ {portfolioPnl.toFixed(2)}</span>
        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isModel
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-600 text-white shadow-sm'
                  }`}
                >
                  {isModel ? <Bot className="w-4 h-4" /> : 'VC'}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    isModel
                      ? 'bg-[#121927] border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm'
                      : 'bg-emerald-600 text-white rounded-tr-xs shadow-sm font-medium'
                  }`}
                >
                  <div className="whitespace-pre-line break-words text-xs">
                    {msg.content}
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] font-mono ${
                      isModel ? 'text-slate-500' : 'text-emerald-200 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#121927] border border-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>QuantAI Copilot analisando métricas de risco e gerando resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-[#0d1322]/50">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Sugestões de Análise de Risco:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[11px] text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 rounded-lg px-2.5 py-1 text-left transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0d1322] border-t border-slate-800">
          {error && (
            <div className="mb-2 text-[11px] text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Copilot sobre risco, drawdown ou lote..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 shrink-0 shadow-sm"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            Respostas orientadas pela IA Gemini 3.5 com base nas métricas reais de risco e posições da plataforma.
          </div>
        </div>
      </div>
    </div>
  );
};
