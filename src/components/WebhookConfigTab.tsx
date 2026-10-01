import React, { useState } from 'react';
import {
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Sliders,
  Bell,
  Trash2,
  Layers,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { BotInstance, WebhookLogEntry } from '../types/trading';

interface WebhookConfigTabProps {
  bot: BotInstance;
  webhooks: BotInstance['webhooks'];
  onChange: (updated: NonNullable<BotInstance['webhooks']>) => void;
  currencySymbol: string;
}

const DEFAULT_WEBHOOKS: NonNullable<BotInstance['webhooks']> = {
  enabled: true,
  url: 'https://discord.com/api/webhooks/1298401829/sample-token',
  preset: 'discord',
  secretToken: 'whsec_quantai_2026',
  events: {
    onOrderOpen: true,
    onOrderClose: true,
    onTakeProfit: true,
    onStopLoss: true,
    onDailyLimit: true,
    onAISignal: false,
  },
  customPayloadTemplate: '',
  history: [
    {
      id: 'wh-initial-1',
      timestamp: '11:15:22',
      event: 'ORDER_OPEN_BUY',
      url: 'https://discord.com/api/webhooks/...',
      status: 'SUCCESS',
      statusCode: 204,
      elapsedMs: 68,
      payloadSummary: 'Ordem COMPRA executada em WIN$N a 128.450 pts (Lote: 1.0)',
    },
    {
      id: 'wh-initial-2',
      timestamp: '11:24:50',
      event: 'TAKE_PROFIT',
      url: 'https://discord.com/api/webhooks/...',
      status: 'SUCCESS',
      statusCode: 204,
      elapsedMs: 75,
      payloadSummary: 'Take Profit atingido (+300 pts) · Lucro Líquido: +R$ 60,00',
    },
  ],
};

export const WebhookConfigTab: React.FC<WebhookConfigTabProps> = ({
  bot,
  webhooks = DEFAULT_WEBHOOKS,
  onChange,
  currencySymbol,
}) => {
  const currentWebhooks = webhooks || DEFAULT_WEBHOOKS;

  const [testEventType, setTestEventType] = useState<'ORDER_OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'CIRCUIT_BREAKER'>('ORDER_OPEN');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode?: number;
    elapsedMs?: number;
    message: string;
    preview?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate resolved sample payload based on preset
  const getSamplePayload = (preset: string, eventType: string) => {
    const isBuy = eventType === 'ORDER_OPEN' || eventType === 'TAKE_PROFIT';
    const action = isBuy ? 'BUY' : 'SELL';
    const samplePrice = bot.assetKey === 'WIN' ? 128450 : bot.assetKey === 'WDO' ? 5420.5 : 64850;
    const samplePnl = eventType === 'TAKE_PROFIT' ? 120.0 : eventType === 'STOP_LOSS' ? -60.0 : 0.0;
    const samplePoints = eventType === 'TAKE_PROFIT' ? bot.takeProfitPoints : eventType === 'STOP_LOSS' ? -bot.stopLossPoints : 0;
    const timestampStr = new Date().toISOString();

    if (preset === 'discord') {
      const embedColor = eventType === 'TAKE_PROFIT' ? 3066993 : eventType === 'STOP_LOSS' ? 15158332 : 3447003;
      return {
        username: `QuantAI - ${bot.name}`,
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2592/2592201.png',
        embeds: [
          {
            title: `🤖 Alerta de Robô: ${eventType.replace(/_/g, ' ')}`,
            description: `Evento disparado pelo motor de inteligência artificial em **${bot.symbol}** (${bot.timeframe}).`,
            color: embedColor,
            fields: [
              { name: 'Ação / Ordem', value: `\`${action}\``, inline: true },
              { name: 'Preço', value: `${samplePrice.toLocaleString('pt-BR')}`, inline: true },
              { name: 'Lotes', value: `${bot.lots}`, inline: true },
              { name: 'Stop Loss', value: `${bot.stopLossPoints} pts`, inline: true },
              { name: 'Take Profit', value: `${bot.takeProfitPoints} pts`, inline: true },
              { name: 'PnL do Trade', value: `${samplePnl >= 0 ? '+' : ''}${currencySymbol} ${samplePnl.toFixed(2)}`, inline: true },
              { name: 'Confiança IA', value: `${Math.round(bot.confidenceThreshold * 100)}%`, inline: true },
              { name: 'Algoritmo', value: `${bot.aiAlgorithm}`, inline: true },
            ],
            footer: {
              text: `QuantAI MT5 & Crypto Platform · ${new Date().toLocaleTimeString('pt-BR')}`,
            },
          },
        ],
      };
    }

    if (preset === 'tradingview') {
      return {
        passphrase: currentWebhooks.secretToken || 'whsec_quantai_2026',
        bot_id: bot.id,
        event: eventType,
        action: action,
        ticker: bot.symbol,
        contracts: bot.lots,
        price: samplePrice,
        stop_loss_points: bot.stopLossPoints,
        take_profit_points: bot.takeProfitPoints,
        confidence: bot.confidenceThreshold,
        timestamp: timestampStr,
      };
    }

    if (preset === 'slack') {
      return {
        text: `🤖 *[QuantAI]* Robô *${bot.name}* executou *${eventType}* em *${bot.symbol}*.\n• *Ação:* ${action} | *Preço:* ${samplePrice}\n• *Lote:* ${bot.lots} | *PnL:* ${samplePnl >= 0 ? '+' : ''}${currencySymbol} ${samplePnl.toFixed(2)}\n• *Confiança IA:* ${Math.round(bot.confidenceThreshold * 100)}%`,
        bot_name: bot.name,
        symbol: bot.symbol,
        event: eventType,
        timestamp: timestampStr,
      };
    }

    // Generic JSON POST
    return {
      source: 'QuantAI_MT5_Algorithmic_Platform',
      event: eventType,
      bot: {
        id: bot.id,
        name: bot.name,
        symbol: bot.symbol,
        timeframe: bot.timeframe,
        magic_number: bot.magicNumber,
      },
      trade: {
        action: action,
        price: samplePrice,
        lots: bot.lots,
        stop_loss_points: bot.stopLossPoints,
        take_profit_points: bot.takeProfitPoints,
        pnl: samplePnl,
        points: samplePoints,
      },
      ai: {
        algorithm: bot.aiAlgorithm,
        confidence_threshold: bot.confidenceThreshold,
      },
      timestamp: timestampStr,
    };
  };

  // Test webhook handler
  const handleTestWebhook = async () => {
    if (!currentWebhooks.url || !currentWebhooks.url.startsWith('http')) {
      setTestResult({
        success: false,
        message: 'Por favor, informe uma URL válida iniciando com http:// ou https://',
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    const testPayload = getSamplePayload(currentWebhooks.preset, testEventType);

    try {
      const response = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: currentWebhooks.url,
          secretToken: currentWebhooks.secretToken,
          payload: testPayload,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          statusCode: data.statusCode,
          elapsedMs: data.elapsedMs,
          message: `Webhook entregue com sucesso! Código HTTP ${data.statusCode} (${data.elapsedMs} ms)`,
          preview: data.responsePreview,
        });

        // Add to history
        const newEntry: WebhookLogEntry = {
          id: `wh-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          event: testEventType,
          url: currentWebhooks.url,
          status: 'SUCCESS',
          statusCode: data.statusCode,
          elapsedMs: data.elapsedMs,
          payloadSummary: `Teste manual de ${testEventType} para ${currentWebhooks.preset.toUpperCase()} (${data.statusCode} OK)`,
        };

        onChange({
          ...currentWebhooks,
          history: [newEntry, ...(currentWebhooks.history || []).slice(0, 19)],
        });
      } else {
        setTestResult({
          success: false,
          statusCode: data.statusCode,
          message: data.error || `Falha no envio (HTTP ${data.statusCode})`,
          preview: data.responsePreview,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro de rede ao despachar webhook',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const currentPayloadPreview = JSON.stringify(getSamplePayload(currentWebhooks.preset, testEventType), null, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Master Webhook Enable Card */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Webhooks de Saída (JSON POST Automático)
                </h3>
                {currentWebhooks.enabled ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    ATIVO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-800 border border-slate-700">
                    DESATIVADO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envie dados em tempo real para URLs externas (Discord, TradingView, Slack, Zapier, n8n ou seu próprio servidor).
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentWebhooks.enabled}
              onChange={(e) =>
                onChange({
                  ...currentWebhooks,
                  enabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-semibold text-slate-200">
              {currentWebhooks.enabled ? 'Webhooks Ativados' : 'Ativar Webhooks'}
            </span>
          </label>
        </div>

        {/* 2. Destination URL & Preset Selector */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                URL de Destino do Webhook (Endpoint HTTP/HTTPS POST):
              </label>
              <input
                type="url"
                value={currentWebhooks.url}
                onChange={(e) =>
                  onChange({
                    ...currentWebhooks,
                    url: e.target.value,
                  })
                }
                placeholder="https://discord.com/api/webhooks/... ou https://meu-servidor.com/api/webhook"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                O robô disparará um HTTP POST com cabeçalho <code className="text-slate-400">Content-Type: application/json</code> sempre que um evento ocorrer.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Formato / Preset do Payload:
              </label>
              <select
                value={currentWebhooks.preset}
                onChange={(e) =>
                  onChange({
                    ...currentWebhooks,
                    preset: e.target.value as any,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="discord">Discord Embed (Mensagem Visual)</option>
                <option value="tradingview">TradingView / Alerta de Ordem</option>
                <option value="slack">Slack / Teams (Mensagem Formatada)</option>
                <option value="generic">JSON Genérico (Telemetria Completa)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ajusta a estrutura do JSON para compatibilidade imediata.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Token de Autenticação / Segredo (Opcional):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={currentWebhooks.secretToken || ''}
                onChange={(e) =>
                  onChange({
                    ...currentWebhooks,
                    secretToken: e.target.value,
                  })
                }
                placeholder="whsec_1294819..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 flex items-center">
                Enviado automaticamente nos cabeçalhos <code className="text-slate-400 mx-1">X-Webhook-Secret</code> e <code className="text-slate-400 mx-1">Authorization: Bearer</code>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Event Triggers Selection */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
          <span>Gatilhos de Disparo de Eventos</span>
          <span className="text-[11px] font-normal normal-case text-slate-400">
            Selecione quais ocorrências devem gerar o disparo do webhook
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              key: 'onOrderOpen',
              label: 'Nova Ordem Executada',
              desc: 'Dispara quando o robô abrir uma posição (COMPRA ou VENDA) no mercado.',
              icon: Zap,
              color: 'text-emerald-400',
            },
            {
              key: 'onOrderClose',
              label: 'Encerramento de Posição',
              desc: 'Dispara no fechamento por alvo, reversão de sinal ou ordem manual.',
              icon: CheckCircle2,
              color: 'text-cyan-400',
            },
            {
              key: 'onTakeProfit',
              label: 'Take Profit Atingido',
              desc: 'Notifica imediatamente quando a meta de lucro de pontos for alcançada.',
              icon: Sparkles,
              color: 'text-emerald-400',
            },
            {
              key: 'onStopLoss',
              label: 'Stop Loss / Breakeven',
              desc: 'Alerta quando a proteção de perda for atingida pelo mercado.',
              icon: AlertCircle,
              color: 'text-rose-400',
            },
            {
              key: 'onDailyLimit',
              label: 'Trava Diária / Circuit Breaker',
              desc: 'Alerta de emergência caso a perda diária máxima seja acionada.',
              icon: AlertCircle,
              color: 'text-amber-400',
            },
            {
              key: 'onAISignal',
              label: 'Sinal de Alta Confiança da IA',
              desc: 'Notifica quando o modelo atingir probabilidade superior ao limiar.',
              icon: Code2,
              color: 'text-purple-400',
            },
          ].map((item) => {
            const isChecked = currentWebhooks.events[item.key as keyof typeof currentWebhooks.events];
            const Icon = item.icon;

            return (
              <label
                key={item.key}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isChecked
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    onChange({
                      ...currentWebhooks,
                      events: {
                        ...currentWebhooks.events,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 rounded accent-emerald-500 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Live Test Webhook & Payload Preview */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Simulação de Envio & Pré-visualização do JSON
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Teste o disparo direto para a sua URL antes de entrar em operação real.
            </p>
          </div>

          {/* Test Action Controls */}
          <div className="flex items-center gap-2">
            <select
              value={testEventType}
              onChange={(e) => setTestEventType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ORDER_OPEN">Simular: Nova Ordem (COMPRA)</option>
              <option value="TAKE_PROFIT">Simular: Take Profit (+R$ 120)</option>
              <option value="STOP_LOSS">Simular: Stop Loss (-R$ 60)</option>
              <option value="CIRCUIT_BREAKER">Simular: Trava de Limite Diário</option>
            </select>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
              <span>{isSendingTest ? 'Enviando...' : 'Enviar Webhook de Teste'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Feedback Alert */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs animate-fade-in ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message}
              </span>
              {testResult.elapsedMs && (
                <span className="font-mono text-[11px] text-slate-300">Tempo: {testResult.elapsedMs} ms</span>
              )}
            </div>
            {testResult.preview && (
              <div className="mt-2 p-2 rounded bg-black/40 font-mono text-[11px] text-slate-300 break-words">
                Resposta da URL: {testResult.preview}
              </div>
            )}
          </div>
        )}

        {/* JSON Preview Viewport */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Corpo da Requisição JSON (Payload formatado para {currentWebhooks.preset.toUpperCase()}):</span>
            <button
              type="button"
              onClick={() => handleCopy(currentPayloadPreview, 'payload')}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedKey === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'payload' ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60 leading-relaxed">
            {currentPayloadPreview}
          </pre>
        </div>
      </div>

      {/* 5. Dispatch History / Logs */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Histórico de Disparos de Webhooks
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registros recentes de requisições POST enviadas para o seu endpoint.
            </p>
          </div>

          {currentWebhooks.history && currentWebhooks.history.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...currentWebhooks,
                  history: [],
                })
              }
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          )}
        </div>

        {(!currentWebhooks.history || currentWebhooks.history.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhum disparo registrado ainda. Utilize o botão "Enviar Webhook de Teste" acima para validar sua conexão.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-3">Horário</th>
                  <th className="py-2 px-3">Evento</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Latência</th>
                  <th className="py-2 px-3">Resumo da Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {currentWebhooks.history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{log.timestamp}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        {log.event}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {log.statusCode ? `HTTP ${log.statusCode}` : log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.elapsedMs ? `${log.elapsedMs} ms` : '---'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs">
                      {log.payloadSummary || log.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Python Integration Code Snippet */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Como o robô Python executa este webhook em produção:
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            webhook_sender.py
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          O pacote baixado em <code>.zip</code> inclui o módulo <code className="text-slate-300">webhook_sender.py</code>. Sempre que o bot abrir ou fechar uma posição no terminal MT5 ou na Binance, ele executa um <code>requests.post()</code> assíncrono em segundo plano para a URL configurada acima, garantindo que suas operações sejam notificadas no Discord ou executadas no TradingView sem atrasar os ticks do robô.
        </p>
      </div>
    </div>
  );
};
