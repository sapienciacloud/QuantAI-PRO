import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  Shield,
  Clock,
  Sliders,
  Bell,
  Cpu,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  Globe,
} from 'lucide-react';
import { BotInstance, AssetKey } from '../types/trading';
import { ASSETS_CONFIG } from '../data/marketData';
import { FEATURE_IMPORTANCES } from '../utils/quantEngine';
import { WebhookConfigTab } from './WebhookConfigTab';

interface BotConfigViewProps {
  bot: BotInstance;
  onSaveBot: (updatedBot: BotInstance) => void;
  onDuplicateBot: (bot: BotInstance) => void;
}

export const BotConfigView: React.FC<BotConfigViewProps> = ({ bot, onSaveBot, onDuplicateBot }) => {
  const [formData, setFormData] = useState<BotInstance>({ ...bot });
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'parameters' | 'ai' | 'webhooks' | 'telegram'>('parameters');

  const assetCfg = ASSETS_CONFIG[formData.assetKey] || ASSETS_CONFIG.WIN;
  const currencySymbol = assetCfg.currency === 'BRL' ? 'R$' : '$';

  const handleFeatureToggle = (featureName: string) => {
    setFormData((prev) => {
      const exists = prev.activeFeatures.includes(featureName);
      return {
        ...prev,
        activeFeatures: exists
          ? prev.activeFeatures.filter((f) => f !== featureName)
          : [...prev.activeFeatures, featureName],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBot(formData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Configurações do Robô: {formData.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modifique regras operacionais, stops em pontos, inteligência artificial, webhooks e alertas externos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showSavedToast && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Alterações salvas com sucesso!
            </div>
          )}

          <button
            type="button"
            onClick={() => onDuplicateBot(formData)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicar Robô
          </button>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation for Bot Settings */}
      <div className="flex items-center gap-1.5 bg-[#0d131f] p-1.5 rounded-xl border border-slate-800 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveConfigTab('parameters')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeConfigTab === 'parameters'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Parâmetros Operacionais & Risco</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveConfigTab('ai')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeConfigTab === 'ai'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Modelo de Inteligência Artificial</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveConfigTab('webhooks')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeConfigTab === 'webhooks'
              ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Webhooks & Alertas HTTP</span>
          {formData.webhooks?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveConfigTab('telegram')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeConfigTab === 'telegram'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notificações Telegram</span>
          {formData.telegram?.enabled && (
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </button>
      </div>

      {/* TAB 1: Parâmetros Operacionais & Risco */}
      {activeConfigTab === 'parameters' && (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1: Identification & Market */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800">
              1. Identificação e Ativo Operado
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Robô</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mercado & Ativo Base</label>
                <select
                  value={formData.assetKey}
                  onChange={(e) => {
                    const newKey = e.target.value as AssetKey;
                    const defaultCfg = ASSETS_CONFIG[newKey];
                    if (defaultCfg) {
                      setFormData({
                        ...formData,
                        assetKey: newKey,
                        symbol: defaultCfg.symbol,
                        lots: defaultCfg.defaultLots,
                        stopLossPoints: defaultCfg.defaultSLPoints,
                        takeProfitPoints: defaultCfg.defaultTPPoints,
                      });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Binance Criptomoedas (Mais Negociados)">
                    <option value="BTCUSDT">BTCUSDT - Bitcoin / Tether USD</option>
                    <option value="ETHUSDT">ETHUSDT - Ethereum / Tether USD</option>
                    <option value="SOLUSDT">SOLUSDT - Solana / Tether USD</option>
                    <option value="BNBUSDT">BNBUSDT - Binance Coin / Tether USD</option>
                    <option value="XRPUSDT">XRPUSDT - Ripple / Tether USD</option>
                  </optgroup>
                  <optgroup label="B3 Brasil (Futuros & Ações)">
                    <option value="WIN">WIN$N - Mini Índice Futuro B3</option>
                    <option value="WDO">WDO$N - Mini Dólar Futuro B3</option>
                    <option value="PETR4">PETR4 - Petrobras PN</option>
                  </optgroup>
                  <optgroup label="Forex Internacional">
                    <option value="EURUSD">EURUSD - Euro vs Dólar Americano</option>
                  </optgroup>
                </select>

                {formData.assetKey.includes('USDT') && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-medium text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Par Binance Futures selecionado
                    </span>
                    <a
                      href="https://www.binance.com/pt-BR/my/settings/api-management"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Abrir Gerenciador de API Binance</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Código do Símbolo / Ticker</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Timeframe Gráfico</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="M1">M1 (1 Minuto - Scalping Ultra Rápido)</option>
                  <option value="M5">M5 (5 Minutos - Padrão Day Trade)</option>
                  <option value="M15">M15 (15 Minutos - Swing / Tendência)</option>
                  <option value="H1">H1 (1 Hora - Posições Longas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Magic Number (ID MT5 / Bot)</label>
                <input
                  type="number"
                  value={formData.magicNumber}
                  onChange={(e) => setFormData({ ...formData, magicNumber: Number(e.target.value) || 2026 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order & Risk Parameters */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              2. Gerenciamento de Risco e Ordens
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Volume / Lotes
                </label>
                <input
                  type="number"
                  step={formData.assetKey === 'EURUSD' ? '0.01' : '1'}
                  value={formData.lots}
                  onChange={(e) => setFormData({ ...formData, lots: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {formData.assetKey === 'WIN' || formData.assetKey === 'WDO' ? 'Mini contratos' : 'Lotes'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Stop Loss (Pontos)
                </label>
                <input
                  type="number"
                  step={assetCfg.tickSize}
                  value={formData.stopLossPoints}
                  onChange={(e) => setFormData({ ...formData, stopLossPoints: Number(e.target.value) || 10 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Risco estrito por trade
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Take Profit (Pontos)
                </label>
                <input
                  type="number"
                  step={assetCfg.tickSize}
                  value={formData.takeProfitPoints}
                  onChange={(e) => setFormData({ ...formData, takeProfitPoints: Number(e.target.value) || 20 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Alvo de lucro planejado
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Trailing Stop (Pontos)
                </label>
                <input
                  type="number"
                  step={assetCfg.tickSize}
                  value={formData.trailingStopPoints}
                  onChange={(e) => setFormData({ ...formData, trailingStopPoints: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Avança SL a favor do trade
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Limite de Perda Diária ({currencySymbol}) - Trava Global
                </label>
                <input
                  type="number"
                  value={formData.maxDailyLoss}
                  onChange={(e) => setFormData({ ...formData, maxDailyLoss: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-rose-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Bloqueia o robô pelo restante do dia ao atingir este valor.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Meta de Lucro Diária ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={formData.dailyProfitGoal}
                  onChange={(e) => setFormData({ ...formData, dailyProfitGoal: Number(e.target.value) || 200 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Encerra as operações do dia ao bater a meta.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Operational Hours */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              3. Janela de Horários de Negociação (B3 / Forex)
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Início de Entradas</label>
                <input
                  type="time"
                  value={formData.startHour}
                  onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Evita leilões de abertura</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Término de Entradas</label>
                <input
                  type="time"
                  value={formData.endHour}
                  onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Não abre novos trades</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Zeragem Obrigatória</label>
                <input
                  type="time"
                  value={formData.closeAllHour}
                  onChange={(e) => setFormData({ ...formData, closeAllHour: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Fecha posições abertas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Modelo de Inteligência Artificial */}
      {activeConfigTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* AI Model Architecture & Threshold */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Parâmetros do Modelo de IA
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Algoritmo Classificador</label>
              <select
                value={formData.aiAlgorithm}
                onChange={(e) => setFormData({ ...formData, aiAlgorithm: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="RandomForest">Random Forest (Ensemble Robusto)</option>
                <option value="HistGradientBoosting">HistGradientBoosting (Rápido e Adaptativo)</option>
                <option value="LogisticRegression">Regressão Logística Regularizada (L2)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Limiar de Confiança da IA:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.round(formData.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.51"
                max="0.80"
                step="0.01"
                value={formData.confidenceThreshold}
                onChange={(e) => setFormData({ ...formData, confidenceThreshold: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Aumentar o limiar reduz o número de operações, priorizando apenas convicções institucionais elevadas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Estimadores (Árvores)</label>
                <input
                  type="number"
                  value={formData.estimators}
                  onChange={(e) => setFormData({ ...formData, estimators: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Profundidade Máx (Depth)</label>
                <input
                  type="number"
                  value={formData.maxDepth}
                  onChange={(e) => setFormData({ ...formData, maxDepth: Number(e.target.value) || 5 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Feature selector */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800">
              Atributos Técnicos (Features) Ativos
            </h3>
            <p className="text-xs text-slate-400">
              Selecione quais indicadores e osciladores alimentam a matriz de features do modelo.
            </p>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {FEATURE_IMPORTANCES.map((f) => {
                const checked = formData.activeFeatures.includes(f.feature);
                return (
                  <label
                    key={f.feature}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 hover:bg-slate-900 text-xs cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleFeatureToggle(f.feature)}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className={`font-mono ${checked ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                        {f.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {f.category}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Webhooks & Alertas HTTP */}
      {activeConfigTab === 'webhooks' && (
        <WebhookConfigTab
          bot={formData}
          webhooks={formData.webhooks}
          onChange={(updated) => setFormData({ ...formData, webhooks: updated })}
          currencySymbol={currencySymbol}
        />
      )}

      {/* TAB 4: Notificações Telegram */}
      {activeConfigTab === 'telegram' && (
        <div className="max-w-2xl bg-[#0d131f] border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" /> Configuração do Telegram Bot
            </span>
            <input
              type="checkbox"
              checked={formData.telegram.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  telegram: { ...formData.telegram, enabled: e.target.checked },
                })
              }
              className="rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          {formData.telegram.enabled ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bot Token (via @BotFather)</label>
                <input
                  type="password"
                  placeholder="bot123456:ABC-DEF..."
                  value={formData.telegram.botToken}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telegram: { ...formData.telegram, botToken: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Chat ID do Canal ou Grupo</label>
                <input
                  type="text"
                  placeholder="-10012345678"
                  value={formData.telegram.chatId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telegram: { ...formData.telegram, chatId: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.telegram.notifyOnEntry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telegram: { ...formData.telegram, notifyOnEntry: e.target.checked },
                      })
                    }
                    className="accent-emerald-500 rounded"
                  />
                  Notificar ao abrir novas ordens (Compra / Venda)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.telegram.notifyOnExit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telegram: { ...formData.telegram, notifyOnExit: e.target.checked },
                      })
                    }
                    className="accent-emerald-500 rounded"
                  />
                  Notificar ao atingir Take Profit ou Stop Loss
                </label>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-4">
              Ative a opção acima para receber mensagens automáticas no seu Telegram sobre cada ordem e resultado.
            </div>
          )}
        </div>
      )}
    </form>
  );
};
