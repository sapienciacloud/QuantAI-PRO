import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { AssetKey, BacktestParams, Candle, LogMessage, Position, BotInstance, BotStatus } from './types/trading';
import { ASSETS_CONFIG, generateHistoricalCandles } from './data/marketData';
import { calculateFeatures, computeModelPredictions, runBacktest } from './utils/quantEngine';
import { fetchBinanceLiveCandles, fetchBinance24hTicker, Binance24hTicker } from './utils/liveMarketApi';
import { PYTHON_PROJECT_FILES } from './data/pythonFiles';
import { INITIAL_BOTS } from './data/initialBots';
import { PlatformTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LiveDashboard } from './components/LiveDashboard';
import { BotConfigView } from './components/BotConfigView';
import { BacktestView } from './components/BacktestView';
import { AIFeaturesView } from './components/AIFeaturesView';
import { CodeExplorer, generateDynamicConfigPy } from './components/CodeExplorer';
import { MT5BridgeView } from './components/MT5BridgeView';

export default function App() {
  const [activeTab, setActiveTab] = useState<PlatformTab>('live');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Multi-bot state
  const [bots, setBots] = useState<BotInstance[]>(() => {
    const saved = localStorage.getItem('quantai_bots_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BOTS;
      }
    }
    return INITIAL_BOTS;
  });

  const [selectedBotId, setSelectedBotId] = useState<string>(INITIAL_BOTS[0].id);

  // Active bot helper
  const activeBot = useMemo(() => {
    return bots.find((b) => b.id === selectedBotId) || bots[0];
  }, [bots, selectedBotId]);

  // Persist bots in localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('quantai_bots_v1', JSON.stringify(bots));
  }, [bots]);

  const assetConfig = ASSETS_CONFIG[activeBot.assetKey] || ASSETS_CONFIG.WIN;

  // Pre-generate rich historical candles with features and ML predictions
  const fullCandleDataset = useMemo(() => {
    const raw = generateHistoricalCandles(activeBot.assetKey, 320);
    const withFeatures = calculateFeatures(raw);
    const withPreds = computeModelPredictions(withFeatures, activeBot.confidenceThreshold);
    return withPreds;
  }, [activeBot.assetKey, activeBot.confidenceThreshold]);

  // Live Simulator state
  const [simIndex, setSimIndex] = useState<number>(75);
  const [isSimulating, setIsSimulating] = useState<boolean>(activeBot.status === 'RUNNING');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [position, setPosition] = useState<Position | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const ticketRef = useRef(104820);

  // Helper to add log
  const addLog = useCallback((level: LogMessage['level'], category: LogMessage['category'], message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        level,
        category,
        message,
      },
      ...prev.slice(0, 150),
    ]);
  }, []);

  // Live Market Data Feed state (Binance REST API + MT5 Bridge)
  const isCryptoAsset = useMemo(() => {
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'EURUSD'].includes(activeBot.symbol) ||
           activeBot.assetKey.includes('USDT');
  }, [activeBot.symbol, activeBot.assetKey]);

  const [isLiveMarketMode, setIsLiveMarketMode] = useState<boolean>(isCryptoAsset);
  const [liveCandles, setLiveCandles] = useState<Candle[]>([]);
  const [isLoadingLiveMarket, setIsLoadingLiveMarket] = useState<boolean>(false);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string>('');
  const [ticker24h, setTicker24h] = useState<Binance24hTicker | null>(null);

  // Fetch live market data directly from Binance or MT5 Bridge
  const fetchLiveMarketData = useCallback(async () => {
    setIsLoadingLiveMarket(true);
    const syncTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      if (isCryptoAsset) {
        // Fetch real-time candles and 24h ticker from Binance Public API
        const [klineRes, tickerRes] = await Promise.all([
          fetchBinanceLiveCandles(activeBot.symbol, activeBot.timeframe, 85),
          fetchBinance24hTicker(activeBot.symbol),
        ]);

        if (klineRes.candles && klineRes.candles.length > 0) {
          // Calculate technical indicators (EMA, SMA, BB, RSI, ATR) on live candles
          const withFeatures = calculateFeatures(klineRes.candles);
          // Run AI model inference on the latest real-time candles
          const withPreds = computeModelPredictions(withFeatures, activeBot.confidenceThreshold);

          setLiveCandles(withPreds);
          if (tickerRes) setTicker24h(tickerRes);
          setLastLiveSyncTime(syncTimeStr);

          const latestCandle = withPreds[withPreds.length - 1];
          const probBuyPct = ((latestCandle.probBuy ?? 0.5) * 100).toFixed(1);
          const probSellPct = ((latestCandle.probSell ?? 0.5) * 100).toFixed(1);

          addLog(
            'SUCCESS',
            'MT5',
            `[API AO VIVO] Dados do gráfico obtidos para ${activeBot.symbol}: Fechamento=${latestCandle.close.toFixed(assetConfig.digits)} | 24h: ${tickerRes?.priceChangePercent ?? '0'}% | IA: P(Alta)=${probBuyPct}%, P(Baixa)=${probSellPct}%`
          );
        } else {
          // Fallback if Binance API was unreachable or rate-limited
          addLog('WARNING', 'MT5', `[API] Resposta vazia da Binance para ${activeBot.symbol}. Utilizando dados locais em fallback.`);
        }
      } else {
        // B3 Asset (WIN, WDO, PETR4): Transmitted via MT5 Terminal Bridge
        setLastLiveSyncTime(syncTimeStr);
        addLog(
          'INFO',
          'MT5',
          `[MT5 BRIDGE] Conexão ativa com terminal MetaTrader 5 (Login: ${activeBot.account.login}). Gráfico M5 de ${activeBot.symbol} sincronizado em tempo real.`
        );
      }
    } catch (err: any) {
      addLog('ERROR', 'SYSTEM', `Erro ao sincronizar informações do gráfico: ${err?.message || 'Falha de rede'}`);
    } finally {
      setIsLoadingLiveMarket(false);
    }
  }, [activeBot.symbol, activeBot.timeframe, activeBot.confidenceThreshold, activeBot.account.login, isCryptoAsset, assetConfig.digits, addLog]);

  // Initial fetch and auto-sync when switching active bot
  useEffect(() => {
    if (isCryptoAsset) {
      setIsLiveMarketMode(true);
      fetchLiveMarketData();
    } else {
      // For B3 assets, let user choose between simulator and MT5 bridge
      setTicker24h(null);
    }
  }, [activeBot.id, activeBot.symbol, isCryptoAsset, fetchLiveMarketData]);

  // Periodic auto-refresh for live market data (every 10 seconds)
  useEffect(() => {
    if (!isLiveMarketMode || !isCryptoAsset) return;

    const timer = setInterval(() => {
      fetchLiveMarketData();
    }, 10000);

    return () => clearInterval(timer);
  }, [isLiveMarketMode, isCryptoAsset, fetchLiveMarketData]);

  // Backtest parameters derived from active bot
  const [backtestParams, setBacktestParams] = useState<BacktestParams>({
    assetKey: activeBot.assetKey,
    initialCapital: 10000,
    lots: activeBot.lots,
    stopLossPoints: activeBot.stopLossPoints,
    takeProfitPoints: activeBot.takeProfitPoints,
    confidenceThreshold: activeBot.confidenceThreshold,
    slippagePoints: activeBot.assetKey === 'WIN' ? 5 : activeBot.assetKey === 'WDO' ? 0.5 : 0.0001,
    costPerTrade: activeBot.assetKey === 'WIN' ? 0.45 : activeBot.assetKey === 'WDO' ? 1.20 : 0.0,
  });

  // Keep backtest params in sync when active bot changes
  useEffect(() => {
    setBacktestParams({
      assetKey: activeBot.assetKey,
      initialCapital: 10000,
      lots: activeBot.lots,
      stopLossPoints: activeBot.stopLossPoints,
      takeProfitPoints: activeBot.takeProfitPoints,
      confidenceThreshold: activeBot.confidenceThreshold,
      slippagePoints: activeBot.assetKey === 'WIN' ? 5 : activeBot.assetKey === 'WDO' ? 0.5 : 0.0001,
      costPerTrade: activeBot.assetKey === 'WIN' ? 0.45 : activeBot.assetKey === 'WDO' ? 1.20 : 0.0,
    });
    setSimIndex(75);
    setPosition(null);
    setIsSimulating(activeBot.status === 'RUNNING');
  }, [activeBot.id, activeBot.assetKey, activeBot.lots, activeBot.stopLossPoints, activeBot.takeProfitPoints, activeBot.confidenceThreshold, activeBot.status]);

  // Backtest Results
  const backtestResult = useMemo(() => {
    return runBacktest(fullCandleDataset, assetConfig, backtestParams);
  }, [fullCandleDataset, assetConfig, backtestParams]);

  // Candles visible to live view (live API candles or simulator range)
  const visibleLiveCandles = useMemo(() => {
    if (isLiveMarketMode && liveCandles.length > 0) {
      return liveCandles;
    }
    return fullCandleDataset.slice(0, simIndex + 1);
  }, [isLiveMarketMode, liveCandles, fullCandleDataset, simIndex]);

  // Initial welcome logs on bot switch
  useEffect(() => {
    setLogs([
      {
        id: '1',
        timestamp: '09:00:01',
        level: 'SUCCESS',
        category: 'MT5',
        message: `[${activeBot.name}] Conexão ativa com MT5 (Login: ${activeBot.account.login} @ ${activeBot.account.server}). Símbolo: ${activeBot.symbol}.`,
      },
      {
        id: '2',
        timestamp: '09:00:03',
        level: 'INFO',
        category: 'AI',
        message: `Modelo IA carregado: ${activeBot.aiAlgorithm} (${activeBot.estimators} estimadores). Limiar de Confiança: ${(activeBot.confidenceThreshold * 100).toFixed(0)}%.`,
      },
      {
        id: '3',
        timestamp: '09:00:05',
        level: 'INFO',
        category: 'SYSTEM',
        message: `Gerenciamento de risco: SL=${activeBot.stopLossPoints} pts, TP=${activeBot.takeProfitPoints} pts, Stop Diário=R$ ${activeBot.maxDailyLoss}, Meta=R$ ${activeBot.dailyProfitGoal}.`,
      },
    ]);
  }, [activeBot.id]);

  // Step simulation logic
  const stepSimulation = useCallback(() => {
    if (activeBot.status !== 'RUNNING') return;

    setSimIndex((prev) => {
      if (prev >= fullCandleDataset.length - 1) {
        setIsSimulating(false);
        addLog('INFO', 'SYSTEM', 'Fim do histórico de candles atingido. Reinicie para continuar a simulação.');
        return prev;
      }

      const nextIdx = prev + 1;
      const nextCandle = fullCandleDataset[nextIdx];
      const currencySymbol = assetConfig.currency === 'BRL' ? 'R$' : '$';

      // 1. Check existing position against current candle's high/low
      setPosition((currentPos) => {
        if (!currentPos) return null;

        let closed = false;
        let exitPrice = 0;
        let reason = '';

        if (currentPos.type === 'BUY') {
          if (nextCandle.low <= currentPos.sl) {
            closed = true;
            exitPrice = currentPos.sl;
            reason = 'Stop Loss';
          } else if (nextCandle.high >= currentPos.tp) {
            closed = true;
            exitPrice = currentPos.tp;
            reason = 'Take Profit';
          }
        } else {
          // SELL
          if (nextCandle.high >= currentPos.sl) {
            closed = true;
            exitPrice = currentPos.sl;
            reason = 'Stop Loss';
          } else if (nextCandle.low <= currentPos.tp) {
            closed = true;
            exitPrice = currentPos.tp;
            reason = 'Take Profit';
          }
        }

        if (closed) {
          const pts = currentPos.type === 'BUY' ? exitPrice - currentPos.entryPrice : currentPos.entryPrice - exitPrice;
          const pnl = pts * assetConfig.pointValue * currentPos.lots;
          const isWin = pnl > 0;
          addLog(
            isWin ? 'SUCCESS' : 'WARNING',
            'ORDER',
            `Posição #${currentPos.ticket} (${currentPos.type}) finalizada por ${reason} a ${exitPrice.toFixed(assetConfig.digits)}. Resultado: ${pnl >= 0 ? '+' : ''}${currencySymbol} ${pnl.toFixed(2)} (${pts.toFixed(assetConfig.digits)} pts).`
          );
          return null;
        }

        // Update floating PnL
        const floatingPts = currentPos.type === 'BUY'
          ? nextCandle.close - currentPos.entryPrice
          : currentPos.entryPrice - nextCandle.close;
        const floatingPnl = floatingPts * assetConfig.pointValue * currentPos.lots;

        return {
          ...currentPos,
          currentPrice: nextCandle.close,
          points: Number(floatingPts.toFixed(assetConfig.digits)),
          pnl: Number(floatingPnl.toFixed(2)),
        };
      });

      // 2. Check for new AI signals if no position is open
      setPosition((currentPos) => {
        if (currentPos) return currentPos;

        if (nextCandle.signal) {
          const ticket = ++ticketRef.current;
          const action = nextCandle.signal;
          const entryPrice = nextCandle.close;
          const slPts = activeBot.stopLossPoints;
          const tpPts = activeBot.takeProfitPoints;

          const slPrice = action === 'BUY' ? entryPrice - slPts : entryPrice + slPts;
          const tpPrice = action === 'BUY' ? entryPrice + tpPts : entryPrice - tpPts;

          const prob = action === 'BUY' ? nextCandle.probBuy : nextCandle.probSell;

          addLog(
            'SUCCESS',
            'MT5',
            `TRADE_RETCODE_DONE (10009): Ordem a mercado executada #${ticket} | ${action} ${activeBot.lots} ${activeBot.symbol} @ ${entryPrice.toFixed(assetConfig.digits)} | Confiança IA: ${((prob ?? 0.6) * 100).toFixed(1)}%`
          );

          return {
            ticket,
            symbol: activeBot.symbol,
            type: action,
            lots: activeBot.lots,
            entryPrice,
            currentPrice: entryPrice,
            sl: Number(slPrice.toFixed(assetConfig.digits)),
            tp: Number(tpPrice.toFixed(assetConfig.digits)),
            points: 0,
            pnl: 0,
            entryTime: nextCandle.time,
          };
        }

        return null;
      });

      return nextIdx;
    });
  }, [fullCandleDataset, assetConfig, activeBot, addLog]);

  // Live simulation tick timer
  useEffect(() => {
    if (!isSimulating || activeBot.status !== 'RUNNING') return;
    const intervalMs = Math.max(100, Math.floor(2000 / simulationSpeed));
    const timer = setInterval(() => {
      stepSimulation();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, stepSimulation, activeBot.status]);

  // Bot Management Handlers
  const handleSaveBot = (updatedBot: BotInstance) => {
    setBots((prev) => prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)));
    addLog('SUCCESS', 'SYSTEM', `Configurações do robô "${updatedBot.name}" atualizadas e salvas com sucesso.`);
  };

  const handleDuplicateBot = (botToClone: BotInstance) => {
    const newId = `bot-${Date.now()}`;
    const cloned: BotInstance = {
      ...botToClone,
      id: newId,
      name: `${botToClone.name} (Cópia)`,
      magicNumber: botToClone.magicNumber + 10,
      status: 'PAUSED',
    };
    setBots((prev) => [...prev, cloned]);
    setSelectedBotId(newId);
    addLog('INFO', 'SYSTEM', `Robô duplicado criado: "${cloned.name}".`);
  };

  const handleCreateBot = () => {
    const newId = `bot-${Date.now()}`;
    const newBot: BotInstance = {
      id: newId,
      name: 'Novo Robô Quant IA',
      description: 'Estratégia personalizada de trading quantitativo no MetaTrader 5',
      assetKey: 'WIN',
      symbol: 'WIN$N',
      timeframe: 'M5',
      status: 'PAUSED',
      lots: 1,
      stopLossPoints: 150,
      takeProfitPoints: 300,
      trailingStopPoints: 100,
      confidenceThreshold: 0.60,
      maxDailyLoss: 250,
      dailyProfitGoal: 500,
      startHour: '09:15',
      endHour: '17:00',
      closeAllHour: '17:35',
      magicNumber: Math.floor(Math.random() * 900000) + 100000,
      aiAlgorithm: 'RandomForest',
      estimators: 150,
      maxDepth: 6,
      activeFeatures: ['RSI_14', 'BB_PctB', 'Log_Return_5', 'EMA_Spread_9_21', 'ATR_Normalized'],
      lastTrained: 'Recém-criado',
      account: {
        login: '8492014',
        server: 'XP-MT5-Demo',
        broker: 'XP Investimentos',
        type: 'DEMO',
        connected: true,
        pingMs: 15,
        balance: 10000,
        equity: 10000,
      },
      telegram: {
        enabled: false,
        botToken: '',
        chatId: '',
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyOnDailyLimit: true,
      },
      stats: {
        todayPnl: 0,
        totalTradesToday: 0,
        winRate: 0,
        profitFactor: 0,
        openPositionsCount: 0,
      },
    };

    setBots((prev) => [...prev, newBot]);
    setSelectedBotId(newId);
    setActiveTab('config');
    addLog('SUCCESS', 'SYSTEM', 'Novo robô template criado. Ajuste seus parâmetros abaixo.');
  };

  const handleToggleBotStatus = () => {
    const nextStatus: BotStatus = activeBot.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    const updated: BotInstance = { ...activeBot, status: nextStatus };
    handleSaveBot(updated);
    setIsSimulating(nextStatus === 'RUNNING');
    addLog(
      nextStatus === 'RUNNING' ? 'SUCCESS' : 'WARNING',
      'SYSTEM',
      `Status do robô alterado para: ${nextStatus === 'RUNNING' ? 'EM EXECUÇÃO' : 'PAUSADO'}.`
    );
  };

  const handleEmergencyCloseAll = () => {
    if (position) {
      const currencySymbol = assetConfig.currency === 'BRL' ? 'R$' : '$';
      addLog(
        'ERROR',
        'ORDER',
        `[PÂNICO] Zeragem emergencial acionada! Posição #${position.ticket} encerrada a mercado com resultado final de ${position.pnl >= 0 ? '+' : ''}${currencySymbol} ${position.pnl.toFixed(2)}.`
      );
      setPosition(null);
    } else {
      addLog('WARNING', 'SYSTEM', '[PÂNICO] Zeragem emergencial acionada. Nenhuma posição aberta para liquidar.');
    }

    // Also pause the bot to prevent immediate re-entry
    if (activeBot.status === 'RUNNING') {
      const updated: BotInstance = { ...activeBot, status: 'PAUSED' };
      handleSaveBot(updated);
      setIsSimulating(false);
    }
  };

  // Custom python file modifications
  const handleSaveCustomFile = (filename: string, content: string) => {
    const customFiles = { ...(activeBot.customPythonFiles || {}), [filename]: content };
    handleSaveBot({ ...activeBot, customPythonFiles: customFiles });
  };

  const handleResetCustomFiles = () => {
    handleSaveBot({ ...activeBot, customPythonFiles: {} });
    addLog('INFO', 'SYSTEM', `Código do robô "${activeBot.name}" restaurado para a versão padrão gerada.`);
  };

  // ZIP Download of all python files incorporating modifications
  const handleDownloadZip = async () => {
    const zip = new JSZip();

    PYTHON_PROJECT_FILES.forEach((f) => {
      let content = f.content;
      // If custom file exists on activeBot, use that
      if (activeBot.customPythonFiles && activeBot.customPythonFiles[f.filename]) {
        content = activeBot.customPythonFiles[f.filename];
      } else if (f.filename === 'config.py') {
        content = generateDynamicConfigPy(activeBot);
      }
      zip.file(f.filename, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantai_${activeBot.symbol.toLowerCase()}_bot.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog('SUCCESS', 'SYSTEM', `Pacote quantai_${activeBot.symbol.toLowerCase()}_bot.zip exportado com sucesso com as configurações do robô "${activeBot.name}".`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col md:flex-row">
      {/* Menu Lateral no Lado Esquerdo (Left Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bots={bots}
        activeBot={activeBot}
        onSelectBot={setSelectedBotId}
        onCreateBot={handleCreateBot}
        onToggleBotStatus={handleToggleBotStatus}
        onEmergencyCloseAll={handleEmergencyCloseAll}
        onDownloadZip={handleDownloadZip}
        isSimulating={isSimulating}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Right of Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Breadcrumbs, Bot Context & Mobile Trigger */}
        <TopHeader
          activeTab={activeTab}
          activeBot={activeBot}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onEmergencyCloseAll={handleEmergencyCloseAll}
          onDownloadZip={handleDownloadZip}
          isSimulating={isSimulating}
        />

        {/* Main Viewport Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          {activeTab === 'live' && (
            <LiveDashboard
            candles={visibleLiveCandles}
            config={assetConfig}
            position={position}
            logs={logs}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
            onToggleSimulate={() => {
              const next = !isSimulating;
              setIsSimulating(next);
              if (next && activeBot.status !== 'RUNNING') {
                handleSaveBot({ ...activeBot, status: 'RUNNING' });
              }
            }}
            onStepSimulate={stepSimulation}
            onResetSimulate={() => {
              setIsSimulating(false);
              setSimIndex(75);
              setPosition(null);
              addLog('INFO', 'SYSTEM', 'Simulador reiniciado na barra 75.');
            }}
            onChangeSpeed={(spd) => setSimulationSpeed(spd)}
            onClosePosition={() => {
              if (!position) return;
              const currencySymbol = assetConfig.currency === 'BRL' ? 'R$' : '$';
              addLog(
                'INFO',
                'ORDER',
                `Ordem a mercado manual para fechar Ticket #${position.ticket}. PnL final: ${position.pnl >= 0 ? '+' : ''}${currencySymbol} ${position.pnl.toFixed(2)}.`
              );
              setPosition(null);
            }}
            onApplyTrailingStop={() => {
              if (!position) return;
              setPosition({ ...position, sl: position.entryPrice });
              addLog('INFO', 'ORDER', `Trailing Stop / Breakeven acionado para #${position.ticket}: SL movido para ${position.entryPrice}.`);
            }}
            onClearLogs={() => setLogs([])}
            confidenceThreshold={activeBot.confidenceThreshold}
            isLiveMarketMode={isLiveMarketMode}
            onToggleLiveMarketMode={() => setIsLiveMarketMode((prev) => !prev)}
            onFetchLiveMarketData={fetchLiveMarketData}
            isLoadingLiveMarket={isLoadingLiveMarket}
            lastLiveSyncTime={lastLiveSyncTime}
            ticker24h={ticker24h}
            bots={bots}
            activeBot={activeBot}
            onToggleBotStatus={(botId) => {
              setBots((prev) =>
                prev.map((b) => {
                  if (b.id === botId) {
                    const nextStatus = b.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
                    addLog(
                      nextStatus === 'RUNNING' ? 'SUCCESS' : 'WARNING',
                      'SYSTEM',
                      `Status do robô "${b.name}" alterado para ${nextStatus === 'RUNNING' ? 'EM OPERAÇÃO' : 'PAUSADO'}.`
                    );
                    return { ...b, status: nextStatus };
                  }
                  return b;
                })
              );
            }}
          />
        )}

        {activeTab === 'config' && (
          <BotConfigView
            bot={activeBot}
            onSaveBot={handleSaveBot}
            onDuplicateBot={handleDuplicateBot}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestView
            metrics={backtestResult.metrics}
            trades={backtestResult.trades}
            equityCurve={backtestResult.equityCurve}
            params={backtestParams}
            config={assetConfig}
            onUpdateParams={setBacktestParams}
            onRunBacktest={() => {
              addLog('INFO', 'AI', `Backtest recalculado para ${activeBot.symbol}: Win Rate ${backtestResult.metrics.winRate}%, Profit Factor ${backtestResult.metrics.profitFactor}.`);
            }}
          />
        )}

        {activeTab === 'ai' && (
          <AIFeaturesView
            bot={activeBot}
            onRetrainModel={() => {
              const now = new Date();
              const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
              handleSaveBot({ ...activeBot, lastTrained: `${timeStr} (5.000 barras M5)` });
              addLog('SUCCESS', 'AI', `Modelo ${activeBot.aiAlgorithm} re-treinado e calibrado com sucesso para ${activeBot.symbol}.`);
            }}
          />
        )}

        {activeTab === 'code' && (
          <CodeExplorer
            bot={activeBot}
            onDownloadZip={handleDownloadZip}
            customFiles={activeBot.customPythonFiles || {}}
            onSaveCustomFile={handleSaveCustomFile}
            onResetCustomFiles={handleResetCustomFiles}
          />
        )}

        {activeTab === 'bridge' && (
          <MT5BridgeView
            bot={activeBot}
            onUpdateAccount={(updatedAccount) => {
              handleSaveBot({ ...activeBot, account: updatedAccount });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#070a10] py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            QuantAI MT5 & Crypto Platform &copy; 2026 · Gestão e Automação Quantitativa
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Robô Ativo: <strong className="text-slate-400 font-mono">{activeBot.name}</strong></span>
            <span>·</span>
            <span>Ativo: <strong className="text-slate-400 font-mono">{activeBot.symbol}</strong></span>
            <span>·</span>
            <span>Conta: <strong className="text-slate-400 font-mono">{activeBot.account.type}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}
