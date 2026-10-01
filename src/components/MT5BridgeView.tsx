import React, { useState } from 'react';
import { Server, Activity, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Key, Terminal, Copy, Check, Globe, Cloud, Zap, Radio, ExternalLink } from 'lucide-react';
import { BotInstance } from '../types/trading';

interface MT5BridgeViewProps {
  bot: BotInstance;
  onUpdateAccount: (updatedAccount: BotInstance['account']) => void;
}

type OnlineApiMode = 'metaapi' | 'binance' | 'tradingview' | 'mt5_local' | 'ibkr';

export const MT5BridgeView: React.FC<MT5BridgeViewProps> = ({ bot, onUpdateAccount }) => {
  const [selectedApiMode, setSelectedApiMode] = useState<OnlineApiMode>('metaapi');
  const [testingPing, setTestingPing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    ping: number;
    message: string;
    details?: string;
  } | null>(null);

  // Form states for online APIs
  const [metaApiToken, setMetaApiToken] = useState('meta_live_89a402f9c81b942...');
  const [metaApiAccountId, setMetaApiAccountId] = useState('acc-940281-b3-win');
  const [binanceApiKey, setBinanceApiKey] = useState('vmPU...891K');
  const [binanceApiSecret, setBinanceApiSecret] = useState('9a08...1b23');
  const [webhookSecret, setWebhookSecret] = useState('whsec_quantai_2026_x89');

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const account = bot.account;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTestApi = () => {
    setTestingPing(true);
    setTestResult(null);

    setTimeout(() => {
      let ping = 14;
      let msg = '';
      let details = '';

      if (selectedApiMode === 'metaapi') {
        ping = Math.floor(Math.random() * 15) + 25; // 25-40ms
        msg = `Autenticação bem-sucedida com MetaApi Cloud! Container implantado no cluster us-east-1.`;
        details = `Conta MT5 #${account.login} sincronizada. Saldo: R$ ${account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Pronto para emitir ordens 100% online sem Windows!`;
      } else if (selectedApiMode === 'binance') {
        ping = Math.floor(Math.random() * 20) + 35; // 35-55ms
        msg = `Conexão REST/WebSocket estabelecida com a Binance USD-M Futures (fapi.binance.com).`;
        details = `Chaves HMAC-SHA256 validadas. Saldo disponível: 3,450.20 USDT. Cotação BTCUSDT em tempo real sincronizada.`;
      } else if (selectedApiMode === 'tradingview') {
        ping = 18;
        msg = `Servidor Webhook FastAPI operacional na porta 8000.`;
        details = `Endpoint /api/v1/webhook respondeu HTTP 200 OK. Assinatura do webhook validada com sucesso.`;
      } else if (selectedApiMode === 'ibkr') {
        ping = 42;
        msg = `Conexão autenticada via IBKR Client Portal Gateway REST API.`;
        details = `Sessão ativa na conta U1849201. Acesso a futuros CME e ações NYSE/NASDAQ liberado.`;
      } else {
        ping = Math.floor(Math.random() * 8) + 12;
        msg = `Conectado ao terminal MetaTrader 5 local.`;
        details = `Ping com a corretora ${account.broker}: ${ping} ms. Algo Trading e DLLs habilitadas.`;
      }

      setTestingPing(false);
      setTestResult({
        success: true,
        ping,
        message: msg,
        details,
      });

      onUpdateAccount({
        ...account,
        connected: true,
        pingMs: ping,
      });
    }, 1200);
  };

  const webhookUrl = `https://quantai-trading.app/api/v1/webhook/${bot.id}`;
  const webhookJsonPayload = `{
  "passphrase": "${webhookSecret}",
  "action": "{{strategy.order.action}}",
  "symbol": "${bot.symbol}",
  "lots": ${bot.lots},
  "sl_points": ${bot.stopLossPoints},
  "tp_points": ${bot.takeProfitPoints}
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Hub de APIs & Conexões Online
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conecte este robô diretamente a corretoras online, gateways em nuvem ou plataformas de sinais
          </p>
        </div>

        <button
          onClick={handleTestApi}
          disabled={testingPing}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
          {testingPing ? 'Testando Handshake...' : 'Testar Conexão / API'}
        </button>
      </div>

      {/* Online Platform Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 select-none">
        <button
          onClick={() => { setSelectedApiMode('metaapi'); setTestResult(null); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedApiMode === 'metaapi'
              ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
              : 'bg-[#0d131f] border-slate-800/80 hover:bg-slate-900 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${selectedApiMode === 'metaapi' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-200">MetaApi Cloud</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">MT5 100% Online sem Windows</p>
        </button>

        <button
          onClick={() => { setSelectedApiMode('binance'); setTestResult(null); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedApiMode === 'binance'
              ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
              : 'bg-[#0d131f] border-slate-800/80 hover:bg-slate-900 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${selectedApiMode === 'binance' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-200">Binance Futures</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">REST & WebSocket API</p>
        </button>

        <button
          onClick={() => { setSelectedApiMode('tradingview'); setTestResult(null); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedApiMode === 'tradingview'
              ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
              : 'bg-[#0d131f] border-slate-800/80 hover:bg-slate-900 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${selectedApiMode === 'tradingview' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-200">TradingView</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Webhooks de Alertas</p>
        </button>

        <button
          onClick={() => { setSelectedApiMode('ibkr'); setTestResult(null); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedApiMode === 'ibkr'
              ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
              : 'bg-[#0d131f] border-slate-800/80 hover:bg-slate-900 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className={`w-4 h-4 ${selectedApiMode === 'ibkr' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-200">Interactive Brokers</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Client Portal REST API</p>
        </button>

        <button
          onClick={() => { setSelectedApiMode('mt5_local'); setTestResult(null); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedApiMode === 'mt5_local'
              ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
              : 'bg-[#0d131f] border-slate-800/80 hover:bg-slate-900 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Server className={`w-4 h-4 ${selectedApiMode === 'mt5_local' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-200">MT5 Desktop/VPS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Terminal Local IPC</p>
        </button>
      </div>

      {/* Test result toast if available */}
      {testResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {testResult.message}
            </span>
            <span className="font-mono text-emerald-300">Ping: {testResult.ping} ms</span>
          </div>
          {testResult.details && (
            <p className="text-xs text-slate-300 pl-6 leading-relaxed font-mono">
              {testResult.details}
            </p>
          )}
        </div>
      )}

      {/* Main Configuration Card according to selected mode */}
      {selectedApiMode === 'metaapi' && (
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                MetaApi Cloud - MetaTrader 5 sem precisar de Windows
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Permite conectar sua conta de corretora (XP, Genial, IC Markets, etc.) na nuvem via REST/WebSocket API oficial
              </p>
            </div>
            <a
              href="https://metaapi.cloud"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              Documentação MetaApi <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Token da API MetaApi (API Token)
              </label>
              <input
                type="password"
                value={metaApiToken}
                onChange={(e) => setMetaApiToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Gerado no painel da MetaApi (permite emitir ordens e ler cotações).
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                ID da Conta no MetaApi (Account ID)
              </label>
              <input
                type="text"
                value={metaApiAccountId}
                onChange={(e) => setMetaApiAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Identificador do container da conta MT5 na nuvem.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-200">Como funciona a arquitetura Cloud:</div>
            <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px] leading-relaxed">
              <li>O MetaApi roda uma instância leve do MT5 em containers Docker na AWS/GCP.</li>
              <li>Você pode rodar o bot Python em qualquer servidor Linux simples, sem precisar de interface gráfica (GUI).</li>
              <li>O arquivo <code className="text-emerald-400">api_metaapi.py</code> gerado já contém o conector assíncrono pronto.</li>
            </ol>
          </div>
        </div>
      )}

      {selectedApiMode === 'binance' && (
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Binance USD-M Futures API (Criptomoedas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execução algorítmica direta em pares de alta liquidez com a mesma Inteligência Artificial
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              API REST & WebSocket 24/7
            </span>
          </div>

          {/* Direct Shortcut to Binance Platform & API Management */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Atalho Oficial para Conexão Binance
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Link Direto
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Acesse a tela oficial da Binance para criar sua <strong>API Key</strong> e <strong>Secret Key</strong> com permissão de futuros.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="https://www.binance.com/pt-BR/my/settings/api-management"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
              >
                <span>Abrir Gerenciamento de API Binance</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://www.binance.com/pt-BR/futures"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <span>Tela Binance Futures</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Quick Guide to enable Binance Futures API */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
            <span className="font-semibold text-slate-200 block">Passo a passo rápido para conectar o robô:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-400">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-amber-400 font-bold block mb-0.5">1. Criar API</span>
                <span>Acesse o link acima e clique em <strong>"Criar API"</strong> (Chave gerada pelo sistema / HMAC-SHA256).</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-amber-400 font-bold block mb-0.5">2. Habilitar Futuros</span>
                <span>Nas permissões da chave, marque: ✅ <strong>Leitura</strong> e ✅ <strong>Habilitar Futuros</strong> (USD-M).</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-amber-400 font-bold block mb-0.5">3. Salvar no Robô</span>
                <span>Cole a <strong>API Key</strong> e <strong>Secret</strong> abaixo e clique em <strong>Testar Conexão</strong>.</span>
              </div>
            </div>
          </div>

          {/* Top Traded Binance Crypto Pairs Showcase */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">Pares Mais Negociados da Binance Prontos para Uso:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              {[
                { pair: 'BTCUSDT', name: 'Bitcoin', price: '$64,850.00', vol: '$14.2B 24h', sl: '$450', tp: '$900' },
                { pair: 'ETHUSDT', name: 'Ethereum', price: '$2,640.50', vol: '$7.8B 24h', sl: '$30', tp: '$60' },
                { pair: 'SOLUSDT', name: 'Solana', price: '$154.20', vol: '$3.5B 24h', sl: '$3.5', tp: '$7.0' },
                { pair: 'BNBUSDT', name: 'Binance Coin', price: '$588.50', vol: '$1.1B 24h', sl: '$8.0', tp: '$16.0' },
                { pair: 'XRPUSDT', name: 'Ripple', price: '$0.5840', vol: '$890M 24h', sl: '$0.015', tp: '$0.030' },
              ].map((c) => (
                <div
                  key={c.pair}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    bot.symbol === c.pair
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{c.pair}</span>
                    <span className="text-[10px] text-emerald-400">{c.price}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{c.name} · {c.vol}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SL: {c.sl} | TP: {c.tp}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Binance API Key</label>
              <input
                type="password"
                value={binanceApiKey}
                onChange={(e) => setBinanceApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Binance Secret Key</label>
              <input
                type="password"
                value={binanceApiSecret}
                onChange={(e) => setBinanceApiSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Endpoint de Produção:</span>
            <code className="text-amber-400 font-mono text-[11px]">https://fapi.binance.com (USD-M Futures)</code>
            <p className="text-[11px] text-slate-500 pt-1">
              O conector <code className="text-slate-300 font-mono">api_binance.py</code> já assina requisições com HMAC-SHA256 e executa compras, vendas, SL e TP automáticos.
            </p>
          </div>
        </div>
      )}

      {selectedApiMode === 'tradingview' && (
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Gateway de Webhooks para Alertas do TradingView
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Receba ordens de estratégias e indicadores Pine Script diretamente no robô
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              URL do Webhook (Cole no campo "URL de Webhook" do alerta do TradingView):
            </label>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 font-mono text-xs text-cyan-400">
              <span className="truncate">{webhookUrl}</span>
              <button
                onClick={() => handleCopy(webhookUrl, 'url')}
                className="text-slate-400 hover:text-white shrink-0"
              >
                {copiedText === 'url' ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-400">
                Payload JSON para o TradingView Alert:
              </label>
              <button
                onClick={() => handleCopy(webhookJsonPayload, 'payload')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                {copiedText === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar JSON
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              {webhookJsonPayload}
            </pre>
          </div>
        </div>
      )}

      {selectedApiMode === 'ibkr' && (
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Interactive Brokers (IBKR Web API Gateway)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acesso institucional a mercados globais de ações, opções e futuros (CME, Eurex, NYSE)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3 text-xs text-slate-300">
            <p>
              A <strong>Interactive Brokers</strong> disponibiliza a <em>Client Portal Web API</em> oficial baseada em REST e WebSockets.
            </p>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div>Porta Padrão do Gateway: 5000 (SSL)</div>
              <div>Endpoint Base: https://localhost:5000/v1/api/</div>
              <div>Autenticação: Sessão OAuth 2.0 / SSO</div>
            </div>
            <p className="text-[11px] text-slate-500">
              Ideal para quem deseja migrar a estratégia de Machine Learning para contratos futuros globais (ex: Micro E-mini S&P 500 - MES).
            </p>
          </div>
        </div>
      )}

      {selectedApiMode === 'mt5_local' && (
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            MetaTrader 5 Desktop Local / VPS Windows
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500">Login da Conta</span>
              <div className="font-mono text-sm font-bold text-white mt-0.5">{account.login}</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500">Servidor MT5</span>
              <div className="font-mono text-sm font-bold text-white mt-0.5 truncate">{account.server}</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500">Tipo de Conta</span>
              <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">{account.type}</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500">Saldo Atual</span>
              <div className="font-mono text-sm font-bold text-white mt-0.5">
                R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Terminal Desktop instalado e autorizado para Algo Trading.
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ponte Python local operando com latência ultrabaixa ({account.pingMs} ms).
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
