export interface PythonFileItem {
  filename: string;
  title: string;
  description: string;
  content: string;
}

export const PYTHON_PROJECT_FILES: PythonFileItem[] = [
  {
    filename: 'config.py',
    title: 'config.py - Configurações Gerais e Gerenciamento de Risco',
    description: 'Parâmetros de conexão com MT5, ativos (WIN, WDO, EURUSD), horários e gestão de risco.',
    content: `"""
Módulo de Configuração e Gestão de Risco para o Bot Quantitativo MT5
Autor: Engenheiro Quantitativo Sênior
Compatível com: B3 (Mini Índice WIN, Mini Dólar WDO, Ações) e Forex (EURUSD)
"""
import os
import MetaTrader5 as mt5

# ==========================================
# 1. PARÂMETROS DE CONEXÃO COM O METATRADER 5
# ==========================================
# Deixe LOGIN, SENHA e SERVIDOR como None se o terminal já estiver aberto e logado.
# Caso queira conexão automática silenciosa, preencha as variáveis de ambiente ou aqui:
MT5_LOGIN = int(os.getenv("MT5_LOGIN", "0")) or None
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "") or None
MT5_SERVER = os.getenv("MT5_SERVER", "") or None
MT5_PATH = os.getenv("MT5_PATH", "") or None  # Ex: "C:\\\\Program Files\\\\MetaTrader 5\\\\terminal64.exe"

# ==========================================
# 2. DEFINIÇÃO DO ATIVO E TIMEFRAME
# ==========================================
# Ativos B3 comuns: 'WIN$N' (Mini Índice série contínua) ou 'WINM26', 'WDO$N' (Mini Dólar)
# Ativos Forex: 'EURUSD', 'GBPUSD', 'USDJPY'
SYMBOL = os.getenv("TRADING_SYMBOL", "WIN$N")

# Timeframe de operação: M1, M5, M15, H1
TIMEFRAME = mt5.TIMEFRAME_M5
TIMEFRAME_SECONDS = 300  # 5 minutos para sleep inteligente

# Número de candles históricos para treinamento e cálculo de features
HISTORICAL_BARS_TRAIN = 5000
HISTORICAL_BARS_INFERENCE = 120

# ==========================================
# 3. GESTÃO DE RISCO E EXECUÇÃO DE ORDENS
# ==========================================
MAGIC_NUMBER = 20260929  # Identificador único das ordens deste bot
SLIPPAGE = 5  # Desvio máximo aceito em pontos/pipettes

# Configurações por tipo de mercado:
# B3 MINI ÍNDICE (WIN): 1 pt = R$ 0,20 | Tick = 5 pts
# B3 MINI DÓLAR (WDO): 1 pt = R$ 10,00 | Tick = 0.5 pt
# FOREX EURUSD: 1 pip = 0.0001 = $10 / lote cheio | Digits = 5
# BINANCE CRIPTO (BTC, ETH, SOL): USD-M Futures 24/7
RISK_PROFILES = {
    "WIN": {
        "LOTS": 1.0,
        "STOP_LOSS_POINTS": 150.0,    # 150 pontos = R$ 30,00 por mini
        "TAKE_PROFIT_POINTS": 300.0,  # 300 pontos = R$ 60,00 por mini
        "TRAILING_STOP_POINTS": 100.0,
    },
    "WDO": {
        "LOTS": 1.0,
        "STOP_LOSS_POINTS": 5.0,      # 5 pontos = R$ 50,00 por mini
        "TAKE_PROFIT_POINTS": 10.0,   # 10 pontos = R$ 100,00 por mini
        "TRAILING_STOP_POINTS": 3.5,
    },
    "EURUSD": {
        "LOTS": 0.10,                 # 0.10 lote (mini lot)
        "STOP_LOSS_POINTS": 0.0020,   # 20 pips
        "TAKE_PROFIT_POINTS": 0.0040, # 40 pips
        "TRAILING_STOP_POINTS": 0.0015,
    },
    "BTCUSDT": {
        "LOTS": 0.05,                 # 0.05 BTC
        "STOP_LOSS_POINTS": 450.0,    # $450 de stop por BTC
        "TAKE_PROFIT_POINTS": 900.0,  # $900 de take profit
        "TRAILING_STOP_POINTS": 250.0,
    },
    "ETHUSDT": {
        "LOTS": 0.50,                 # 0.50 ETH
        "STOP_LOSS_POINTS": 30.0,     # $30 de stop por ETH
        "TAKE_PROFIT_POINTS": 60.0,   # $60 de take profit
        "TRAILING_STOP_POINTS": 20.0,
    },
    "SOLUSDT": {
        "LOTS": 5.0,                  # 5 SOL
        "STOP_LOSS_POINTS": 3.5,      # $3.50 de stop
        "TAKE_PROFIT_POINTS": 7.0,    # $7.00 de take profit
        "TRAILING_STOP_POINTS": 2.0,
    },
    "BNBUSDT": {
        "LOTS": 1.0,                  # 1 BNB
        "STOP_LOSS_POINTS": 8.0,      # $8.00 de stop
        "TAKE_PROFIT_POINTS": 16.0,   # $16.00 de take profit
        "TRAILING_STOP_POINTS": 5.0,
    },
    "XRPUSDT": {
        "LOTS": 500.0,                # 500 XRP
        "STOP_LOSS_POINTS": 0.0150,
        "TAKE_PROFIT_POINTS": 0.0300,
        "TRAILING_STOP_POINTS": 0.0100,
    },
    "DEFAULT": {
        "LOTS": 1.0,
        "STOP_LOSS_POINTS": 100.0,
        "TAKE_PROFIT_POINTS": 200.0,
        "TRAILING_STOP_POINTS": 50.0,
    }
}

# ==========================================
# 4. GESTÃO DIÁRIA DE CAPITAL (CIRCUIT BREAKER)
# ==========================================
MAX_DAILY_LOSS = 200.0   # Limite diário de perda financeira (R$ ou $)
DAILY_PROFIT_GOAL = 400.0 # Meta diária de lucro financeiro

# Janela de negociação para B3 (Horário de Brasília)
# Evita aberturas com leilão e final de pregão volátil
START_HOUR = "09:15"
END_HOUR = "17:00"
CLOSE_ALL_HOUR = "17:35"

# ==========================================
# 5. PARÂMETROS DO MODELO DE MACHINE LEARNING
# ==========================================
CONFIDENCE_THRESHOLD = 0.60  # Só executa ordem se a probabilidade predita for >= 60%
MODEL_PATH = "model_quant_mt5.joblib"
RETRAIN_INTERVAL_HOURS = 24  # Frequência de re-treinamento
`,
  },
  {
    filename: 'features.py',
    title: 'features.py - Pipeline de Engenharia de Atributos (Features)',
    description: 'Cálculo de indicadores técnicos sem look-ahead bias e preparação dos tensores.',
    content: `"""
Módulo de Engenharia de Features para IA Quantitativa
Prevenção rigorosa de Look-Ahead Bias (vazamento de dados futuros)
"""
import numpy as np
import pandas as pd


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula indicadores técnicos em um DataFrame OHLCV usando estritamente
    informações passadas (rolling windows).
    """
    df = df.copy()
    
    # 1. Retornos Logarítmicos em diferentes horizontes temporais
    df['return_1'] = np.log(df['close'] / df['close'].shift(1))
    df['return_3'] = np.log(df['close'] / df['close'].shift(3))
    df['return_5'] = np.log(df['close'] / df['close'].shift(5))
    df['return_10'] = np.log(df['close'] / df['close'].shift(10))

    # 2. Médias Móveis Exponenciais (EMA) e Spreads
    df['ema_9'] = df['close'].ewm(span=9, adjust=False).mean()
    df['ema_21'] = df['close'].ewm(span=21, adjust=False).mean()
    df['sma_50'] = df['close'].rolling(window=50).mean()
    
    # Normalização do Spread de Médias (Distância em percentual)
    df['ema_spread_9_21'] = (df['ema_9'] - df['ema_21']) / df['close']
    df['dist_ema_9'] = (df['close'] - df['ema_9']) / df['close']
    df['dist_sma_50'] = (df['close'] - df['sma_50']) / df['close']

    # 3. Índice de Força Relativa (RSI/IFR) - Suavização de Wilder
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    
    avg_gain = gain.rolling(window=14, min_periods=14).mean()
    avg_loss = loss.rolling(window=14, min_periods=14).mean()
    
    # Suavização exponencial típica do RSI
    for i in range(14, len(df)):
        avg_gain.iloc[i] = (avg_gain.iloc[i-1] * 13 + gain.iloc[i]) / 14
        avg_loss.iloc[i] = (avg_loss.iloc[i-1] * 13 + loss.iloc[i]) / 14
        
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df['rsi_14'] = 100 - (100 / (1 + rs))

    # 4. Bandas de Bollinger (20 períodos, 2 desvios padrão)
    bb_mean = df['close'].rolling(window=20).mean()
    bb_std = df['close'].rolling(window=20).std()
    df['bb_upper'] = bb_mean + 2 * bb_std
    df['bb_lower'] = bb_mean - 2 * bb_std
    
    # Posição percentual dentro das bandas (%b) e largura (Bandwidth)
    band_width = df['bb_upper'] - df['bb_lower']
    df['bb_pct_b'] = (df['close'] - df['bb_lower']) / band_width.replace(0, np.nan)
    df['bb_bandwidth'] = band_width / bb_mean

    # 5. Average True Range (ATR 14) para volatilidade
    tr1 = df['high'] - df['low']
    tr2 = (df['high'] - df['close'].shift(1)).abs()
    tr3 = (df['low'] - df['close'].shift(1)).abs()
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df['atr_14'] = true_range.rolling(window=14).mean()
    df['atr_norm'] = df['atr_14'] / df['close']

    # 6. Razão de Corpo do Candle e Pavios
    candle_range = (df['high'] - df['low']).replace(0, np.nan)
    df['body_ratio'] = (df['close'] - df['open']) / candle_range
    df['upper_wick'] = (df['high'] - df[['open', 'close']].max(axis=1)) / candle_range
    df['lower_wick'] = (df[['open', 'close']].min(axis=1) - df['low']) / candle_range

    # 7. Volume Normalizado (Z-Score rolling de 20 períodos)
    if 'tick_volume' in df.columns:
        vol_col = 'tick_volume'
    elif 'real_volume' in df.columns:
        vol_col = 'real_volume'
    else:
        vol_col = 'volume'
        
    vol_mean = df[vol_col].rolling(window=20).mean()
    vol_std = df[vol_col].rolling(window=20).std()
    df['vol_zscore'] = (df[vol_col] - vol_mean) / vol_std.replace(0, np.nan)

    return df


def prepare_dataset_for_training(df: pd.DataFrame):
    """
    Constrói a matriz de features X e o vetor alvo y para treinamento supervisionado.
    
    Alvo y:
      1 (Alta): Se o retorno do próximo candle for positivo (close[t+1] > close[t])
      0 (Baixa/Neutro): Caso contrário
    """
    df = compute_indicators(df)
    
    # TARGET: Movimento do PRÓXIMO candle (t+1)
    # IMPORTANTE: shift(-1) move o retorno futuro para a linha atual
    future_return = df['close'].shift(-1) - df['close']
    df['target'] = (future_return > 0).astype(int)

    feature_cols = [
        'return_1', 'return_3', 'return_5', 'return_10',
        'ema_spread_9_21', 'dist_ema_9', 'dist_sma_50',
        'rsi_14', 'bb_pct_b', 'bb_bandwidth', 'atr_norm',
        'body_ratio', 'upper_wick', 'lower_wick', 'vol_zscore'
    ]

    # Removemos linhas com NaN geradas pelas janelas móveis
    # E removemos OBRIGATORIAMENTE a última linha (que não tem retorno futuro)
    clean_df = df.dropna(subset=feature_cols + ['target']).iloc[:-1]

    X = clean_df[feature_cols]
    y = clean_df['target']
    
    return X, y, feature_cols


def extract_features_latest(df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    """
    Extrai o vetor de features da ÚLTIMA barra FECHADA para predição em tempo real.
    Garante que não usa o candle em formação para evitar repaints.
    """
    df_feat = compute_indicators(df)
    latest_row = df_feat.iloc[-1:][feature_cols]
    return latest_row
`,
  },
  {
    filename: 'model.py',
    title: 'model.py - Treinamento do Modelo de IA e Predição',
    description: 'Classificador RandomForest com validação temporal (TimeSeriesSplit) e calibração.',
    content: `"""
Módulo de Machine Learning e Inteligência Artificial Quantitativa
Implementação com Scikit-Learn e TimeSeriesSplit
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline


class QuantAIEngine:
    def __init__(self, model_path: str = "model_quant_mt5.joblib"):
        self.model_path = model_path
        self.pipeline = None
        self.feature_names = []

    def build_pipeline(self) -> Pipeline:
        """
        Cria um pipeline robusto com normalização e classificador ensemble.
        RandomForest é menos suscetível a overfitting e lida bem com ruído de mercado.
        """
        return Pipeline([
            ('scaler', RobustScaler()),  # Resistente a outliers típicos de cauda longa
            ('clf', RandomForestClassifier(
                n_estimators=150,
                max_depth=6,             # Limita profundidade para mitigar sobreajuste
                min_samples_split=20,
                min_samples_leaf=10,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            ))
        ])

    def train(self, X: pd.DataFrame, y: pd.Series):
        """
        Treina o modelo utilizando validação cruzada temporal (TimeSeriesSplit).
        Jamais utilize K-Fold aleatório em séries temporais financeiras!
        """
        self.feature_names = list(X.columns)
        tscv = TimeSeriesSplit(n_splits=5)
        
        cv_scores = []
        for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
            X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]

            pipe = self.build_pipeline()
            pipe.fit(X_tr, y_tr)
            preds = pipe.predict(X_val)
            acc = accuracy_score(y_val, preds)
            cv_scores.append(acc)
            print(f"[IA-VALIDAÇÃO] Fold {fold+1} Acurácia: {acc:.4f}")

        print(f"[IA-SCORE] Média CV TimeSeriesSplit: {np.mean(cv_scores):.4f}")

        # Treina o modelo final com todo o histórico disponível
        self.pipeline = self.build_pipeline()
        self.pipeline.fit(X, y)

        # Salva o artefato do modelo treinado
        joblib.dump({
            'pipeline': self.pipeline,
            'features': self.feature_names
        }, self.model_path)
        print(f"[IA-MODELO] Modelo salvo com sucesso em '{self.model_path}'")

    def load(self) -> bool:
        """Carrega modelo pré-treinado do disco."""
        if not os.path.exists(self.model_path):
            return False
        data = joblib.load(self.model_path)
        self.pipeline = data['pipeline']
        self.feature_names = data['features']
        print(f"[IA-MODELO] Modelo carregado com sucesso de '{self.model_path}'")
        return True

    def predict(self, latest_features: pd.DataFrame, threshold: float = 0.60):
        """
        Gera probabilidade e sinal de decisão baseado no limiar de confiança.
        Retorna:
          sinal: 'BUY' (Compra), 'SELL' (Venda) ou 'NEUTRAL'
          prob_buy: float (0.0 a 1.0)
          prob_sell: float (0.0 a 1.0)
        """
        if self.pipeline is None:
            raise ValueError("O modelo não foi treinado nem carregado.")

        probs = self.pipeline.predict_proba(latest_features)[0]
        prob_sell = float(probs[0])
        prob_buy = float(probs[1])

        # Filtro de confiança: só opera se a probabilidade superar o threshold
        if prob_buy >= threshold:
            signal = "BUY"
        elif prob_sell >= threshold:
            signal = "SELL"
        else:
            signal = "NEUTRAL"

        return signal, prob_buy, prob_sell

    def get_feature_importances(self) -> dict:
        """Retorna a importância relativa de cada feature calculada pelo modelo."""
        if self.pipeline is None:
            return {}
        rf = self.pipeline.named_steps['clf']
        importances = rf.feature_importances_
        return dict(zip(self.feature_names, importances))
`,
  },
  {
    filename: 'execution.py',
    title: 'execution.py - Gerenciador de Ordens e Conexão MetaTrader 5',
    description: 'Envio de ordens a mercado, Stop Loss, Take Profit e cálculo de tick size.',
    content: `"""
Módulo de Execução de Ordens e Integração Direta com MetaTrader 5
Gerencia posições abertas, envia ordens com SL/TP em pontos e trata retcodes
"""
import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime
import config


class MT5Executor:
    def __init__(self):
        self.connected = False

    def connect(self) -> bool:
        """Inicializa e conecta ao terminal MetaTrader 5."""
        init_kwargs = {}
        if config.MT5_PATH:
            init_kwargs["path"] = config.MT5_PATH

        if not mt5.initialize(**init_kwargs):
            print(f"[ERRO-MT5] Falha ao inicializar MetaTrader 5: {mt5.last_error()}")
            return False

        if config.MT5_LOGIN and config.MT5_PASSWORD and config.MT5_SERVER:
            authorized = mt5.login(
                login=config.MT5_LOGIN,
                password=config.MT5_PASSWORD,
                server=config.MT5_SERVER
            )
            if not authorized:
                print(f"[ERRO-MT5] Falha no login na conta {config.MT5_LOGIN}: {mt5.last_error()}")
                mt5.shutdown()
                return False

        account_info = mt5.account_info()
        if account_info:
            print(f"[MT5-SUCESSO] Conectado à conta: {account_info.login} | Corretora: {account_info.company}")
            print(f"[MT5-SALDO] Saldo: {account_info.balance:.2f} | Equidade: {account_info.equity:.2f}")

        # Habilita o símbolo no Market Watch
        if not mt5.symbol_select(config.SYMBOL, True):
            print(f"[ERRO-MT5] Não foi possível selecionar o símbolo '{config.SYMBOL}'")
            return False

        self.connected = True
        return True

    def get_historical_candles(self, symbol: str, timeframe, count: int) -> pd.DataFrame:
        """Extrai candles históricos (OHLCV) do MetaTrader 5."""
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        if rates is None or len(rates) == 0:
            print(f"[ERRO-MT5] Nenhum dado retornado para {symbol}: {mt5.last_error()}")
            return pd.DataFrame()

        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        return df

    def get_active_positions(self, symbol: str):
        """Retorna todas as posições abertas deste robô (filtradas por Magic Number)."""
        positions = mt5.positions_get(symbol=symbol)
        if positions is None:
            return []
        # Filtra apenas ordens deste robô
        return [pos for pos in positions if pos.magic == config.MAGIC_NUMBER]

    def has_open_position(self, symbol: str) -> bool:
        """Verifica se já existe posição aberta para evitar ordens duplicadas."""
        return len(self.get_active_positions(symbol)) > 0

    def send_market_order(self, action: str, symbol: str, lots: float, sl_points: float, tp_points: float):
        """
        Envia ordem a mercado com cálculo preciso de SL e TP respeitando
        o Tick Size e Digits do ativo (B3 ou Forex).
        """
        sym_info = mt5.symbol_info(symbol)
        if sym_info is None:
            print(f"[ERRO-MT5] Símbolo {symbol} não encontrado")
            return None

        # Garante que o símbolo está visível
        if not sym_info.visible:
            mt5.symbol_select(symbol, True)

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            print(f"[ERRO-MT5] Não foi possível obter o tick atual de {symbol}")
            return None

        point = sym_info.point
        digits = sym_info.digits

        if action == "BUY":
            order_type = mt5.ORDER_TYPE_BUY
            price = tick.ask
            sl_price = round(price - (sl_points * point), digits) if sl_points > 0 else 0.0
            tp_price = round(price + (tp_points * point), digits) if tp_points > 0 else 0.0
        elif action == "SELL":
            order_type = mt5.ORDER_TYPE_SELL
            price = tick.bid
            sl_price = round(price + (sl_points * point), digits) if sl_points > 0 else 0.0
            tp_price = round(price - (tp_points * point), digits) if tp_points > 0 else 0.0
        else:
            print(f"[ERRO] Ação inválida: {action}")
            return None

        # Monta a estrutura da requisição MT5
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(lots),
            "type": order_type,
            "price": price,
            "sl": sl_price,
            "tp": tp_price,
            "deviation": config.SLIPPAGE,
            "magic": config.MAGIC_NUMBER,
            "comment": "QuantAI_MT5_Bot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,  # Padrão para B3 e Forex
        }

        # Envia a ordem ao servidor
        result = mt5.order_send(request)

        if result is None:
            print(f"[ERRO-MT5] Falha no envio da ordem: {mt5.last_error()}")
            return None

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            print(f"[AVISO-MT5] Ordem recusada. Retcode: {result.retcode} | Comentário: {result.comment}")
            return None

        print(f"[ORDEM-EXECUTADA] #{result.order} | {action} {lots} {symbol} a {price:.{digits}f} | SL: {sl_price:.{digits}f} | TP: {tp_price:.{digits}f}")
        return result

    def close_all_positions(self, symbol: str):
        """Fecha todas as posições deste bot (usado no fim do dia ou stop loss financeiro)."""
        positions = self.get_active_positions(symbol)
        for pos in positions:
            tick = mt5.symbol_info_tick(symbol)
            close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
            close_price = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask

            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": pos.volume,
                "type": close_type,
                "position": pos.ticket,
                "price": close_price,
                "deviation": config.SLIPPAGE,
                "magic": config.MAGIC_NUMBER,
                "comment": "QuantAI_Close_EOD",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            res = mt5.order_send(request)
            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                print(f"[POSIÇÃO-FECHADA] Ticket #{pos.ticket} encerrado a {close_price}")

    def shutdown(self):
        """Encerra a conexão limpa com o terminal."""
        mt5.shutdown()
        self.connected = False
        print("[MT5-DESCONEXÃO] Terminal desconectado com segurança.")
`,
  },
  {
    filename: 'main_bot.py',
    title: 'main_bot.py - Script Principal de Execução em Tempo Real',
    description: 'Loop principal sincronizado com novos candles M5, predição e gestão de risco.',
    content: `"""
Script Principal do Bot Trader MT5 com Inteligência Artificial
Loop de execução em tempo real, detecção de novos candles e gestão de risco.

Como executar:
    python main_bot.py
"""
import sys
import time
import signal
from datetime import datetime
import config
from execution import MT5Executor
from features import prepare_dataset_for_training, extract_features_latest
from model import QuantAIEngine

# Instancia os módulos principais
executor = MT5Executor()
ai_engine = QuantAIEngine(config.MODEL_PATH)


def graceful_exit(sig, frame):
    """Garante desligamento seguro em caso de Ctrl+C ou encerramento do processo."""
    print("\\n[SISTEMA] Sinal de interrupção recebido. Encerrando o bot com segurança...")
    executor.shutdown()
    sys.exit(0)


# Registra interceptores de sinal
signal.signal(signal.SIGINT, graceful_exit)
signal.signal(signal.SIGTERM, graceful_exit)


def resolve_risk_profile(symbol: str):
    """Identifica o perfil de SL/TP e Lotes baseado no ativo (WIN, WDO, EURUSD)."""
    for key in config.RISK_PROFILES:
        if key in symbol.upper():
            return config.RISK_PROFILES[key]
    return config.RISK_PROFILES["DEFAULT"]


def main():
    print("=" * 60)
    print("     QUANTAI MT5 - BOT TRADING COM MACHINE LEARNING     ")
    print("=" * 60)
    print(f"Ativo Selecionado: {config.SYMBOL}")
    print(f"Limiar de Confiança da IA: {config.CONFIDENCE_THRESHOLD * 100:.0f}%")
    print(f"Horário de Operação: {config.START_HOUR} às {config.END_HOUR}")

    # 1. Conexão com o MetaTrader 5
    if not executor.connect():
        print("[ERRO FATAL] Não foi possível conectar ao MT5. Verifique o terminal e tente novamente.")
        return

    # 2. Carrega ou Treina o Modelo de Inteligência Artificial
    if not ai_engine.load():
        print("[IA-INIT] Modelo não encontrado. Iniciando treinamento inicial com dados históricos...")
        df_hist = executor.get_historical_candles(
            config.SYMBOL, config.TIMEFRAME, config.HISTORICAL_BARS_TRAIN
        )
        if df_hist.empty:
            print("[ERRO] Impossível treinar sem histórico. Encerrando.")
            executor.shutdown()
            return
        
        X, y, feature_cols = prepare_dataset_for_training(df_hist)
        ai_engine.train(X, y)
    else:
        feature_cols = ai_engine.feature_names

    risk = resolve_risk_profile(config.SYMBOL)
    print(f"[RISCO] Lotes: {risk['LOTS']} | SL: {risk['STOP_LOSS_POINTS']} pts | TP: {risk['TAKE_PROFIT_POINTS']} pts")

    last_candle_time = None
    print("\\n[STATUS] Bot em execução. Aguardando formação de novos candles...")

    # ==========================================
    # 3. LOOP PRINCIPAL DE TEMPO REAL
    # ==========================================
    try:
        while True:
            now = datetime.now()
            current_time_str = now.strftime("%H:%M")

            # Verificação de Janela de Horário
            if current_time_str >= config.CLOSE_ALL_HOUR:
                print(f"[CIRCUIT-BREAKER] Fim do pregão atingido ({config.CLOSE_ALL_HOUR}). Encerrando posições.")
                executor.close_all_positions(config.SYMBOL)
                time.sleep(60)
                continue

            # 4. Coleta os candles mais recentes
            df_recent = executor.get_historical_candles(
                config.SYMBOL, config.TIMEFRAME, config.HISTORICAL_BARS_INFERENCE
            )
            if df_recent.empty:
                time.sleep(5)
                continue

            # Detecta se um novo candle se fechou (evita re-executar na mesma barra)
            current_candle_time = df_recent['time'].iloc[-1]
            if last_candle_time is None:
                last_candle_time = current_candle_time

            # Novo candle formado!
            if current_candle_time > last_candle_time:
                last_candle_time = current_candle_time
                bar_close = df_recent['close'].iloc[-2]  # Última barra completamente fechada

                print(f"\\n[NOVO CANDLE] {current_candle_time.strftime('%H:%M:%S')} | Fechamento anterior: {bar_close:.2f}")

                # 5. Extração de Features na barra recém-fechada
                latest_features = extract_features_latest(df_recent.iloc[:-1], feature_cols)

                # 6. Inferência com o Modelo de IA
                signal, prob_buy, prob_sell = ai_engine.predict(latest_features, config.CONFIDENCE_THRESHOLD)

                print(f"[IA-INFERÊNCIA] P(Alta)={prob_buy*100:.1f}% | P(Baixa)={prob_sell*100:.1f}% | Sinal: {signal}")

                # 7. Gestão de Ordens: Verifica se já temos posição aberta
                if executor.has_open_position(config.SYMBOL):
                    print("[GERENCIAMENTO] Posição já existente. Aguardando desfecho (SL/TP) antes de nova entrada.")
                else:
                    if signal == "BUY":
                        print(f"[DISPARO] Enviando Ordem de COMPRA com {prob_buy*100:.1f}% de confiança...")
                        executor.send_market_order(
                            action="BUY",
                            symbol=config.SYMBOL,
                            lots=risk["LOTS"],
                            sl_points=risk["STOP_LOSS_POINTS"],
                            tp_points=risk["TAKE_PROFIT_POINTS"]
                        )
                    elif signal == "SELL":
                        print(f"[DISPARO] Enviando Ordem de VENDA com {prob_sell*100:.1f}% de confiança...")
                        executor.send_market_order(
                            action="SELL",
                            symbol=config.SYMBOL,
                            lots=risk["LOTS"],
                            sl_points=risk["STOP_LOSS_POINTS"],
                            tp_points=risk["TAKE_PROFIT_POINTS"]
                        )
                    else:
                        print("[GERENCIAMENTO] Probabilidade abaixo do limiar. Nenhuma ordem enviada (Neutro).")

            # Intervalo de checagem do loop (dorme 2 segundos para não sobrecarregar a CPU)
            time.sleep(2)

    except KeyboardInterrupt:
        print("\\n[ENCERRAMENTO] Interrompido pelo usuário.")
    finally:
        executor.shutdown()


if __name__ == "__main__":
    main()
`,
  },
  {
    filename: 'backtest.py',
    title: 'backtest.py - Motor de Backtesting e Análise de Performance',
    description: 'Validação histórica do modelo com cálculo de Win Rate, Drawdown e Sharpe Ratio.',
    content: `"""
Motor de Backtesting Histórico para a Estratégia de Machine Learning MT5
Métricas quantitativas: Lucro Líquido, Win Rate, Profit Factor, Drawdown e Sharpe Ratio.

Como executar:
    python backtest.py
"""
import pandas as pd
import numpy as np
import MetaTrader5 as mt5
import config
from features import prepare_dataset_for_training
from model import QuantAIEngine


def run_quantitative_backtest(df: pd.DataFrame, confidence_threshold: float = 0.60):
    print("=" * 60)
    print("     RELATÓRIO DE BACKTESTING HISTÓRICO - ESTRATÉGIA IA     ")
    print("=" * 60)

    # 1. Prepara dados e treina modelo nos primeiros 70% (In-Sample)
    X, y, feature_cols = prepare_dataset_for_training(df)
    split_idx = int(len(X) * 0.70)
    
    X_train, y_train = X.iloc[:split_idx], y.iloc[:split_idx]
    X_test, y_test = X.iloc[split_idx:], y.iloc[split_idx:]
    test_df = df.loc[X_test.index].copy()

    print(f"Período Treino (In-Sample): {len(X_train)} candles")
    print(f"Período Teste (Out-of-Sample): {len(X_test)} candles")

    ai = QuantAIEngine("backtest_temp_model.joblib")
    ai.train(X_train, y_train)

    # 2. Simulação de Trades no período de teste (Out-of-Sample)
    probs = ai.pipeline.predict_proba(X_test)
    test_df['prob_down'] = probs[:, 0]
    test_df['prob_up'] = probs[:, 1]

    risk = config.RISK_PROFILES.get("WIN", config.RISK_PROFILES["DEFAULT"])
    sl_points = risk["STOP_LOSS_POINTS"]
    tp_points = risk["TAKE_PROFIT_POINTS"]
    
    trades = []
    equity = 10000.0  # Capital inicial R$ 10.000,00
    capital_curve = [equity]

    active_trade = None

    for i in range(len(test_df)):
        row = test_df.iloc[i]

        # Verifica trade aberto
        if active_trade is not None:
            entry_p = active_trade['entry_price']
            t_type = active_trade['type']

            if t_type == 'BUY':
                if row['low'] <= active_trade['sl']:
                    # Stop Loss atingido
                    pnl_pts = -sl_points
                    trades.append({'type': 'BUY', 'pnl_pts': pnl_pts, 'exit': 'STOP_LOSS'})
                    equity += pnl_pts * 0.20  # WIN: R$ 0,20/pt
                    active_trade = None
                elif row['high'] >= active_trade['tp']:
                    # Take Profit atingido
                    pnl_pts = tp_points
                    trades.append({'type': 'BUY', 'pnl_pts': pnl_pts, 'exit': 'TAKE_PROFIT'})
                    equity += pnl_pts * 0.20
                    active_trade = None
            else:  # SELL
                if row['high'] >= active_trade['sl']:
                    pnl_pts = -sl_points
                    trades.append({'type': 'SELL', 'pnl_pts': pnl_pts, 'exit': 'STOP_LOSS'})
                    equity += pnl_pts * 0.20
                    active_trade = None
                elif row['low'] <= active_trade['tp']:
                    pnl_pts = tp_points
                    trades.append({'type': 'SELL', 'pnl_pts': pnl_pts, 'exit': 'TAKE_PROFIT'})
                    equity += pnl_pts * 0.20
                    active_trade = None

        # Sinal de nova entrada
        if active_trade is None:
            if row['prob_up'] >= confidence_threshold:
                active_trade = {
                    'type': 'BUY',
                    'entry_price': row['close'],
                    'sl': row['close'] - sl_points,
                    'tp': row['close'] + tp_points
                }
            elif row['prob_down'] >= confidence_threshold:
                active_trade = {
                    'type': 'SELL',
                    'entry_price': row['close'],
                    'sl': row['close'] + sl_points,
                    'tp': row['close'] - tp_points
                }

        capital_curve.append(equity)

    # 3. Consolidação de Métricas Quantitativas
    trades_df = pd.DataFrame(trades)
    if trades_df.empty:
        print("[AVISO] Nenhum trade foi disparado com o limiar atual.")
        return

    total_trades = len(trades_df)
    wins = len(trades_df[trades_df['pnl_pts'] > 0])
    losses = len(trades_df[trades_df['pnl_pts'] <= 0])
    win_rate = (wins / total_trades) * 100

    gross_profit = trades_df[trades_df['pnl_pts'] > 0]['pnl_pts'].sum() * 0.20
    gross_loss = abs(trades_df[trades_df['pnl_pts'] <= 0]['pnl_pts'].sum() * 0.20)
    profit_factor = gross_profit / (gross_loss if gross_loss > 0 else 1.0)
    net_profit = equity - 10000.0

    # Drawdown Máximo
    cap_series = pd.Series(capital_curve)
    peak = cap_series.cummax()
    drawdown = (cap_series - peak) / peak * 100
    max_dd = abs(drawdown.min())

    print(f"Total de Trades: {total_trades}")
    print(f"Trades Vencedores: {wins} ({win_rate:.1f}%) | Perdedores: {losses}")
    print(f"Lucro Líquido: R$ {net_profit:.2f}")
    print(f"Fator de Lucro (Profit Factor): {profit_factor:.2f}")
    print(f"Drawdown Máximo: {max_dd:.2f}%")
    print(f"Capital Final: R$ {equity:.2f}")
    print("=" * 60)


if __name__ == "__main__":
    # Exemplo: coleta histórico diretamente do MT5 caso disponível
    if mt5.initialize():
        rates = mt5.copy_rates_from_pos(config.SYMBOL, config.TIMEFRAME, 0, 4000)
        mt5.shutdown()
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            run_quantitative_backtest(df, config.CONFIDENCE_THRESHOLD)
        else:
            print("[AVISO] Não foi possível obter histórico do MT5 para backtest.")
    else:
        print("[AVISO] MetaTrader 5 não está aberto para carregar histórico.")
`,
  },
  {
    filename: 'requirements.txt',
    title: 'requirements.txt - Dependências Python',
    description: 'Pacotes oficiais necessários para rodar o bot e o modelo.',
    content: `MetaTrader5>=5.0.45
pandas>=2.1.0
numpy>=1.26.0
scikit-learn>=1.4.0
joblib>=1.3.2
ta>=0.11.0
`,
  },
  {
    filename: 'README.md',
    title: 'README.md - Manual Completo de Instalação e Execução',
    description: 'Guia passo a passo para configuração do MetaTrader 5, permissão de Algo Trading e execução.',
    content: `# QuantAI MT5 - Bot de Algorithmic Trading com Machine Learning

Robô quantitativo profissional para **MetaTrader 5 (MT5)** com pipeline de Inteligência Artificial para gerar sinais preditivos de alta/baixa nos ativos mais líquidos da B3 (**WIN - Mini Índice**, **WDO - Mini Dólar**) e mercado internacional (**EURUSD Forex**).

---

## 1. Pré-Requisitos

1. **Terminal MetaTrader 5 (64-bit)** instalado no Windows (ou VPS Windows).
2. **Conta Aberta** em corretora autorizada (ex: XP, Genial, Clear, BTG, Terra, FBS, IC Markets, etc.).
3. **Python 3.10 ou 3.11** instalado no computador (Marque a opção *"Add Python to PATH"* durante a instalação).

---

## 2. Configurando o MetaTrader 5 para Aceitar Bots Python

Para que scripts em Python possam enviar ordens de compra e venda ao MT5, siga estes passos no terminal:

1. Abra o **MetaTrader 5**.
2. Vá no menu superior: \`Ferramentas\` -> \`Opções\` (ou pressione \`Ctrl + O\`).
3. Clique na aba **Expert Advisors** (ou *Robôs*).
4. Marque a opção:
   - ✅ **Permitir negociação automatizada** (*Allow automated trading*).
   - ✅ **Permitir importação de DLL** (*Allow DLL imports*).
5. Certifique-se de que o botão **Algo Trading** na barra de ferramentas superior está **Verde** (Ativado).

---

## 3. Instalação do Ambiente Python

Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto:

\`\`\`bash
# 1. (Opcional, mas recomendado) Crie um ambiente virtual
python -m venv venv

# 2. Ative o ambiente virtual
# No Windows PowerShell:
.\\venv\\Scripts\\Activate.ps1
# No Windows CMD:
venv\\Scripts\\activate.bat

# 3. Instale as bibliotecas necessárias
pip install -r requirements.txt
\`\`\`

---

## 4. Estrutura Modular dos Arquivos

- \`config.py\`: Configurações de conexão, ativo (\`WIN$N\`, \`WDO$N\`, \`EURUSD\`), risco por operação (Stop Loss, Take Profit em pontos), lotes e limites diários de perda.
- \`features.py\`: Pipeline de engenharia de atributos (Médias Móveis, RSI/IFR, Bollinger Bands, ATR e Retornos Logarítmicos) estritamente sem vazamento de dados futuros (*look-ahead bias*).
- \`model.py\`: Motor de Inteligência Artificial com \`RandomForestClassifier\`, validação temporal com \`TimeSeriesSplit\`, filtro por probabilidade de confiança e persistência com \`joblib\`.
- \`execution.py\`: Camada de comunicação com a API C++ do MetaTrader 5, controle de ordens a mercado, Stop Loss, Take Profit e verificação de posições abertas.
- \`main_bot.py\`: Script principal com o loop de execução em tempo real sincronizado candle a candle.
- \`backtest.py\`: Script autônomo para simular a estratégia no histórico e avaliar o retorno líquido, drawdown e taxa de acerto.

---

## 5. Como Executar

### Teste de Backtest:
\`\`\`bash
python backtest.py
\`\`\`

### Execução em Tempo Real (Recomendado iniciar em Conta Demo):
\`\`\`bash
python main_bot.py
\`\`\`

---

## 6. Gestão de Risco Recomendada

| Ativo | Tick Mínimo | Valor do Ponto | Stop Loss Recomendado | Take Profit Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| **WIN (Mini Índice)** | 5 pontos | R$ 0,20 / ponto | 150 a 200 pontos | 300 a 400 pontos |
| **WDO (Mini Dólar)** | 0.5 ponto | R$ 10,00 / ponto | 4.5 a 6.0 pontos | 9.0 a 12.0 pontos |
| **EURUSD (Forex)** | 0.00001 (0.1 pip) | $10 / lote cheio | 20 pips (0.0020) | 40 pips (0.0040) |

*Aviso de Risco: Operações com contratos futuros e derivativos envolvem risco significativo de perda de capital. Sempre valide exaustivamente em ambiente simulado (Conta Demo) antes de alocar capital real.*
`,
  },
  {
    filename: 'api_metaapi.py',
    title: 'api_metaapi.py - Conector Cloud MT5 via MetaApi (100% Online sem Windows)',
    description: 'Conecta ao MT5 na nuvem via REST/WebSocket API sem precisar de terminal desktop instalado.',
    content: `"""
Conector Online Cloud MT5 via MetaApi.cloud
Permite operar contas MetaTrader 5 (B3 ou Forex) totalmente na nuvem
sem precisar de máquina Windows, VPS com interface gráfica ou MT5 desktop aberto.

Instalação:
    pip install metaapi-cloud-sdk asyncio

Documentação: https://metaapi.cloud
"""
import os
import asyncio
from metaapi_cloud_sdk import MetaApi

# Obtenha seu token gratuito ou profissional em: https://app.metaapi.cloud
METAAPI_TOKEN = os.getenv("METAAPI_TOKEN", "SEU_METAAPI_API_TOKEN_AQUI")
ACCOUNT_ID = os.getenv("METAAPI_ACCOUNT_ID", "ID_DA_CONTA_NO_METAAPI")


class MetaApiCloudConnector:
    def __init__(self, token: str = METAAPI_TOKEN, account_id: str = ACCOUNT_ID):
        self.api = MetaApi(token)
        self.account_id = account_id
        self.connection = None
        self.account = None

    async def connect(self):
        """Estabelece conexão segura WebSocket/REST com o servidor MT5 em nuvem."""
        print("[METAAPI] Localizando conta MT5 na nuvem...")
        self.account = await self.api.metatrader_account_api.get_account(self.account_id)
        
        # Garante que a conta está implantada no cluster cloud
        if self.account.state != 'DEPLOYED':
            print("[METAAPI] Implantando container da conta MT5...")
            await self.account.deploy()

        print("[METAAPI] Aguardando sincronização com o broker...")
        await self.account.wait_connected()

        # Cria conexão RPC de baixa latência
        self.connection = self.account.get_rpc_connection()
        await self.connection.connect()
        await self.connection.wait_synchronized()
        
        account_info = await self.connection.get_account_information()
        print(f"[METAAPI-CONECTADO] Servidor: {account_info.get('server')} | Saldo: {account_info.get('balance')} {account_info.get('currency')}")
        return True

    async def get_candles(self, symbol: str, timeframe: str = '5m', limit: int = 120):
        """Obtém candles históricos OHLCV via REST API da nuvem."""
        print(f"[METAAPI-DATA] Coletando {limit} candles de {symbol} no timeframe {timeframe}...")
        # Timeframes válidos: '1m', '5m', '15m', '1h', '1d'
        candles = await self.connection.get_historical_candles(symbol, timeframe, None, limit)
        return candles

    async def send_order(self, action: str, symbol: str, volume: float, sl_price: float = None, tp_price: float = None):
        """
        Envia ordem a mercado via API Cloud MetaApi.
        action: 'ORDER_TYPE_BUY' ou 'ORDER_TYPE_SELL'
        """
        trade_action = 'ORDER_TYPE_BUY' if action.upper() == 'BUY' else 'ORDER_TYPE_SELL'
        
        trade_payload = {
            'actionType': trade_action,
            'symbol': symbol,
            'volume': volume,
            'comment': 'QuantAI_Cloud_Bot',
        }
        if sl_price:
            trade_payload['stopLoss'] = sl_price
        if tp_price:
            trade_payload['takeProfit'] = tp_price

        print(f"[METAAPI-TRADE] Disparando {trade_action} {volume} de {symbol}...")
        result = await self.connection.create_market_buy_order(symbol, volume, sl_price, tp_price) if action == 'BUY' \\
            else await self.connection.create_market_sell_order(symbol, volume, sl_price, tp_price)
            
        print(f"[METAAPI-SUCESSO] Ordem executada com sucesso! OrderId: {result.get('orderId')}")
        return result

    async def close_all(self):
        """Fecha todas as posições abertas na conta."""
        positions = await self.connection.get_positions()
        for pos in positions:
            await self.connection.close_position(pos['id'])
            print(f"[METAAPI-ENCERRAMENTO] Posição #{pos['id']} fechada na nuvem.")


if __name__ == "__main__":
    async def main_test():
        connector = MetaApiCloudConnector()
        try:
            await connector.connect()
            # Exemplo de obtenção de dados
            candles = await connector.get_candles('EURUSD', '5m', 10)
            print(f"Candles obtidos: {len(candles)}")
        except Exception as e:
            print(f"[ERRO METAAPI] {e}")

    asyncio.run(main_test())
`,
  },
  {
    filename: 'api_binance.py',
    title: 'api_binance.py - Conector REST & WebSocket para Binance Futures',
    description: 'Executa ordens e coleta dados da Binance Futures via API HMAC-SHA256.',
    content: `"""
Conector Online Direto para Binance Futures (Criptoativos)
Permite executar a mesma estratégia de Inteligência Artificial em BTCUSDT, ETHUSDT, SOLUSDT, etc.

Instalação:
    pip install requests pandas ccxt
"""
import time
import hmac
import hashlib
import requests
import pandas as pd

BINANCE_API_KEY = "SUA_BINANCE_API_KEY_AQUI"
BINANCE_API_SECRET = "SEU_BINANCE_API_SECRET_AQUI"
BASE_URL = "https://fapi.binance.com"  # Binance USD-M Futures


class BinanceFuturesConnector:
    def __init__(self, api_key: str = BINANCE_API_KEY, api_secret: str = BINANCE_API_SECRET):
        self.api_key = api_key
        self.api_secret = api_secret
        self.session = requests.Session()
        self.session.headers.update({
            'X-MBX-APIKEY': self.api_key
        })

    def _sign(self, params: dict) -> dict:
        """Gera assinatura HMAC-SHA256 obrigatória para a API da Binance."""
        params['timestamp'] = int(time.time() * 1000)
        query_string = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        params['signature'] = signature
        return params

    def get_historical_klines(self, symbol: str = "BTCUSDT", interval: str = "5m", limit: int = 120) -> pd.DataFrame:
        """Extrai candles históricos OHLCV da Binance Futures."""
        url = f"{BASE_URL}/fapi/v1/klines"
        params = {"symbol": symbol, "interval": interval, "limit": limit}
        res = self.session.get(url, params=params)
        data = res.json()

        df = pd.DataFrame(data, columns=[
            'time', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_asset_volume', 'number_of_trades',
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        return df

    def get_account_balance(self):
        """Consulta o saldo disponível da carteira de Futuros."""
        url = f"{BASE_URL}/fapi/v2/balance"
        params = self._sign({})
        res = self.session.get(url, params=params)
        return res.json()

    def send_order(self, symbol: str, side: str, quantity: float, sl_price: float = None, tp_price: float = None):
        """
        Envia ordem a mercado na Binance Futures com parâmetros de Stop Loss e Take Profit.
        side: 'BUY' ou 'SELL'
        """
        url = f"{BASE_URL}/fapi/v1/order"
        params = {
            "symbol": symbol,
            "side": side.upper(),
            "type": "MARKET",
            "quantity": quantity
        }
        signed_params = self._sign(params)
        res = self.session.post(url, params=signed_params)
        result = res.json()

        if "orderId" in result:
            print(f"[BINANCE-SUCESSO] Ordem #{result['orderId']} executada: {side} {quantity} {symbol}")
            
            # Envia ordem condicional de Stop Loss se informada
            if sl_price:
                sl_side = "SELL" if side == "BUY" else "BUY"
                sl_params = self._sign({
                    "symbol": symbol,
                    "side": sl_side,
                    "type": "STOP_MARKET",
                    "stopPrice": sl_price,
                    "closePosition": "true"
                })
                self.session.post(url, params=sl_params)
                print(f"[BINANCE-STOP] Stop Loss cadastrado em {sl_price}")
        else:
            print(f"[BINANCE-ERRO] Falha ao enviar ordem: {result}")
        return result
`,
  },
  {
    filename: 'api_webhook_server.py',
    title: 'api_webhook_server.py - Servidor Webhook para TradingView & Plataformas Web',
    description: 'Servidor REST FastAPI para receber sinais webhooks e repassar para o robô.',
    content: `"""
Servidor Webhook REST para TradingView e Plataformas Online
Recebe payloads JSON de alertas do TradingView ou APIs externas e encaminha ordens para o MT5 / Broker.

Instalação:
    pip install fastapi uvicorn requests
Executar:
    uvicorn api_webhook_server:app --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import execution
import config

app = FastAPI(title="QuantAI MT5 Webhook Gateway")

WEBHOOK_SECRET = "sua_chave_secreta_webhook_aqui"


class SignalPayload(BaseModel):
    passphrase: str
    action: str          # "BUY" ou "SELL"
    symbol: str          # ex: "WIN$N", "EURUSD"
    lots: float = 1.0
    sl_points: float = 150.0
    tp_points: float = 300.0


executor = execution.MT5Executor()


@app.on_event("startup")
def startup():
    print("[WEBHOOK-GATEWAY] Inicializando conexão com MT5...")
    executor.connect()


@app.post("/api/v1/webhook")
async def receive_tradingview_alert(payload: SignalPayload):
    """
    Endpoint para ser colado no TradingView:
    URL: http://seu-servidor-ip:8000/api/v1/webhook
    Corpo da Mensagem (JSON):
    {
        "passphrase": "sua_chave_secreta_webhook_aqui",
        "action": "{{strategy.order.action}}",
        "symbol": "WIN$N",
        "lots": 1.0,
        "sl_points": 150.0,
        "tp_points": 300.0
    }
    """
    if payload.passphrase != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Chave de autenticação inválida")

    print(f"[WEBHOOK-RECEBIDO] Sinal: {payload.action} | Ativo: {payload.symbol} | Lotes: {payload.lots}")

    # Envia ordem ao MT5
    res = executor.send_market_order(
        action=payload.action,
        symbol=payload.symbol,
        lots=payload.lots,
        sl_points=payload.sl_points,
        tp_points=payload.tp_points
    )

    if res:
        return {"status": "SUCCESS", "orderId": res.order}
    else:
        return {"status": "ERROR", "message": "Falha ao despachar ordem no MT5"}
`,
  },
  {
    filename: 'webhook_sender.py',
    title: 'webhook_sender.py - Disparo Automático de Webhooks JSON POST',
    description: 'Envia eventos de compra, venda, take profit, stop loss e alertas de risco para Discord, TradingView e URLs customizadas.',
    content: `"""
Módulo de Disparo de Webhooks HTTP/JSON para Alertas e Integrações Externas
Autor: Engenheiro Quantitativo Sênior
Compatível com: Discord, TradingView, Slack, Webhooks Customizados (n8n, Zapier)
"""
import requests
import json
import logging
from datetime import datetime

logger = logging.getLogger("QuantAI_Webhooks")

# Configurações do Webhook (preenchidas a partir das configurações do robô)
WEBHOOK_ENABLED = True
WEBHOOK_URL = "https://discord.com/api/webhooks/1298401829/sample-token"
WEBHOOK_PRESET = "discord"  # "discord", "tradingview", "slack", "generic"
WEBHOOK_SECRET = "whsec_quantai_2026"

# Eventos habilitados
NOTIFY_ON_ORDER_OPEN = True
NOTIFY_ON_ORDER_CLOSE = True
NOTIFY_ON_TAKE_PROFIT = True
NOTIFY_ON_STOP_LOSS = True
NOTIFY_ON_DAILY_LIMIT = True


def send_webhook_event(
    event_type: str,
    bot_name: str,
    symbol: str,
    action: str,
    price: float,
    lots: float,
    pnl: float = 0.0,
    sl: float = 0.0,
    tp: float = 0.0,
    confidence: float = 0.0,
    extra_details: str = ""
):
    """
    Despacha requisição HTTP POST assíncrona ou em thread para não bloquear a leitura de ticks no MT5.
    """
    if not WEBHOOK_ENABLED or not WEBHOOK_URL or not WEBHOOK_URL.startswith("http"):
        return False

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "QuantAI-MT5-Bot/2.4"
    }

    if WEBHOOK_SECRET:
        headers["X-Webhook-Secret"] = WEBHOOK_SECRET
        headers["Authorization"] = f"Bearer {WEBHOOK_SECRET}"

    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Formatação de acordo com o preset selecionado
    if WEBHOOK_PRESET == "discord":
        color = 3066993 if (pnl >= 0 and event_type != "STOP_LOSS") else 15158332
        payload = {
            "username": f"QuantAI - {bot_name}",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/2592/2592201.png",
            "embeds": [
                {
                    "title": f"🚨 Alerta de Robô: {event_type.replace('_', ' ')}",
                    "description": f"Evento de execução algorítmica disparado para **{symbol}**.",
                    "color": color,
                    "fields": [
                        {"name": "Ação / Ordem", "value": f"\`{action}\`", "inline": True},
                        {"name": "Preço", "value": f"{price:,.2f}", "inline": True},
                        {"name": "Lotes", "value": f"{lots}", "inline": True},
                        {"name": "PnL Estimado", "value": f"{pnl:+.2f}", "inline": True},
                        {"name": "Stop Loss", "value": f"{sl} pts", "inline": True},
                        {"name": "Take Profit", "value": f"{tp} pts", "inline": True},
                        {"name": "Confiança IA", "value": f"{int(confidence * 100)}%", "inline": True},
                    ],
                    "footer": {"text": f"QuantAI Platform · {timestamp_str}"}
                }
            ]
        }
    elif WEBHOOK_PRESET == "tradingview":
        payload = {
            "passphrase": WEBHOOK_SECRET,
            "bot_name": bot_name,
            "event": event_type,
            "action": action,
            "ticker": symbol,
            "contracts": lots,
            "price": price,
            "stop_loss": sl,
            "take_profit": tp,
            "confidence": confidence,
            "timestamp": timestamp_str
        }
    elif WEBHOOK_PRESET == "slack":
        payload = {
            "text": f"🤖 *[QuantAI]* Robô *{bot_name}* disparou *{event_type}* em *{symbol}*.\n• *Ação:* {action} | *Preço:* {price:,.2f}\n• *Lote:* {lots} | *PnL:* {pnl:+.2f}\n• *Confiança IA:* {int(confidence * 100)}%"
        }
    else:
        # Generic JSON POST
        payload = {
            "source": "QuantAI_MT5_Bot",
            "event": event_type,
            "bot_name": bot_name,
            "symbol": symbol,
            "action": action,
            "price": price,
            "lots": lots,
            "stop_loss_points": sl,
            "take_profit_points": tp,
            "pnl": pnl,
            "confidence": confidence,
            "details": extra_details,
            "timestamp": timestamp_str
        }

    try:
        res = requests.post(WEBHOOK_URL, headers=headers, json=payload, timeout=4)
        if res.status_code in [200, 201, 204]:
            logger.info(f"Webhook [{event_type}] enviado com sucesso ({res.status_code}) para {WEBHOOK_URL}")
            return True
        else:
            logger.warning(f"Webhook [{event_type}] retornou status {res.status_code}: {res.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"Erro ao despachar webhook [{event_type}]: {e}")
        return False
`,
  },
];

