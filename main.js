/**
 * Main Integration Module for Trading Bot
 * Connects all components: MetaMask, AI Agent, Timeframes, and Trade Execution
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    const aiDebugger = new AIMetaMaskDebugger();
    const aiAgent = new AITradingAgent();
    const timeframes = new TradingTimeframes();
    const tradeExecution = new TradeExecution(timeframes);
    const antarctic = new AntarcticExchangeTrader();
    
    // Initialize UI
    initializeUI();
    
    // Start AI debugging agent
    aiDebugger.initialize().then(() => {
        addToSystemLog('AI Debugging Agent initialized');
        
        // Initialize AI trading agent
        aiAgent.initialize('Scalping');
        addToSystemLog('AI Trading Agent initialized with Scalping strategy');
        
        // Connect components
        connectComponents(aiDebugger, aiAgent, timeframes, tradeExecution, antarctic);
    });
    
    /**
     * Initialize UI elements
     */
    function initializeUI() {
        // Add timeframe selection UI
        addTimeframeUI();
        
        // Add leverage selection UI
        addLeverageUI();
        
        // Add trading controls
        addTradingControlsUI();
        
        // Add risk management UI
        addRiskManagementUI();
    }
    
    /**
     * Add timeframe selection UI
     */
    function addTimeframeUI() {
        const walletCard = document.querySelector('.card:nth-child(1)');
        if (!walletCard) return;
        
        // Create timeframe card
        const timeframeCard = document.createElement('div');
        timeframeCard.className = 'card';
        timeframeCard.innerHTML = `
            <h2>Trading Timeframe</h2>
            <div class="timeframe-buttons">
                <button id="scalp-btn" class="timeframe-btn">Scalping</button>
                <button id="day-btn" class="timeframe-btn active">Day Trading</button>
                <button id="swing-btn" class="timeframe-btn">Swing Trading</button>
            </div>
            <div class="timeframe-details">
                <div>
                    <span>Description: </span>
                    <span id="timeframe-description">Intraday trades (completed within same day)</span>
                </div>
                <div>
                    <span>Target Profit: </span>
                    <span id="target-profit">2.0%</span>
                </div>
                <div>
                    <span>Stop Loss: </span>
                    <span id="stop-loss">1.0%</span>
                </div>
                <div>
                    <span>Max Trades/Day: </span>
                    <span id="max-trades">5</span>
                </div>
            </div>
        `;
        
        // Insert after wallet card
        walletCard.parentNode.insertBefore(timeframeCard, walletCard.nextSibling);
        
        // Add event listeners
        document.getElementById('scalp-btn').addEventListener('click', () => {
            setTimeframe('scalp');
        });
        
        document.getElementById('day-btn').addEventListener('click', () => {
            setTimeframe('day');
        });
        
        document.getElementById('swing-btn').addEventListener('click', () => {
            setTimeframe('swing');
        });
    }
    
    /**
     * Add leverage selection UI
     */
    function addLeverageUI() {
        const timeframeCard = document.querySelector('.card:nth-child(2)');
        if (!timeframeCard) return;
        
        // Create leverage card
        const leverageCard = document.createElement('div');
        leverageCard.className = 'card';
        leverageCard.innerHTML = `
            <h2>Leverage</h2>
            <div class="leverage-slider-container">
                <input type="range" id="leverage-slider" min="10" max="50" step="5" value="25">
                <span id="leverage-value">25x</span>
            </div>
            <div class="leverage-buttons">
                <button class="leverage-btn" data-value="10">10x</button>
                <button class="leverage-btn" data-value="15">15x</button>
                <button class="leverage-btn" data-value="20">20x</button>
                <button class="leverage-btn active" data-value="25">25x</button>
                <button class="leverage-btn" data-value="30">30x</button>
                <button class="leverage-btn" data-value="35">35x</button>
                <button class="leverage-btn" data-value="40">40x</button>
                <button class="leverage-btn" data-value="45">45x</button>
                <button class="leverage-btn" data-value="50">50x</button>
            </div>
            <div class="leverage-warning">
                <p>Higher leverage increases both potential profits and risks.</p>
            </div>
        `;
        
        // Insert after timeframe card
        timeframeCard.parentNode.insertBefore(leverageCard, timeframeCard.nextSibling);
        
        // Add event listeners
        const leverageSlider = document.getElementById('leverage-slider');
        const leverageValue = document.getElementById('leverage-value');
        
        leverageSlider.addEventListener('input', () => {
            const value = leverageSlider.value;
            leverageValue.textContent = value + 'x';
            setLeverage(parseInt(value));
            
            // Update active button
            document.querySelectorAll('.leverage-btn').forEach(btn => {
                if (parseInt(btn.getAttribute('data-value')) === parseInt(value)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
        
        document.querySelectorAll('.leverage-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.getAttribute('data-value'));
                leverageSlider.value = value;
                leverageValue.textContent = value + 'x';
                setLeverage(value);
                
                // Update active button
                document.querySelectorAll('.leverage-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });
    }
    
    /**
     * Add trading controls UI
     */
    function addTradingControlsUI() {
        const aiCard = document.querySelector('.card:nth-child(4)');
        if (!aiCard) return;
        
        // Add trading controls to AI card
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'trading-controls';
        controlsDiv.innerHTML = `
            <button id="start-trading" class="btn">Start Trading</button>
            <button id="stop-trading" class="btn" disabled>Stop Trading</button>
        `;
        
        aiCard.appendChild(controlsDiv);
        
        // Add event listeners
        document.getElementById('start-trading').addEventListener('click', () => {
            startTrading();
        });
        
        document.getElementById('stop-trading').addEventListener('click', () => {
            stopTrading();
        });
    }
    
    /**
     * Add risk management UI
     */
    function addRiskManagementUI() {
        const aiCard = document.querySelector('.card:nth-child(4)');
        if (!aiCard) return;
        
        // Add risk management section to AI card
        const riskDiv = document.createElement('div');
        riskDiv.className = 'risk-management';
        riskDiv.innerHTML = `
            <h3>Risk Management</h3>
            <div>
                <span>Daily P/L: </span>
                <span id="daily-pl">0.00%</span>
            </div>
            <div>
                <span>Daily Loss Limit: </span>
                <span id="loss-limit">-10.00%</span>
            </div>
            <div>
                <span>Daily Profit Target: </span>
                <span id="profit-target">20.00%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" id="pl-progress-bar"></div>
            </div>
        `;
        
        aiCard.appendChild(riskDiv);
    }
    
    /**
     * Connect all components
     */
    function connectComponents(aiDebugger, aiAgent, timeframes, tradeExecution, antarctic) {
        // Connect AI agent with trade execution
        aiAgent.onSignalGenerated = (signal) => {
            addToSystemLog(`AI signal generated: ${signal.type} with ${signal.confidence}% confidence`);
            
            // Forward signal to trade execution
            if (tradeExecution.isTrading) {
                const direction = signal.type === 'BUY' ? 'long' : 'short';
                tradeExecution.executeEntry(direction, `AI signal: ${signal.reasoning}`);
            }
        };
        
        // Connect trade execution with antarctic exchange
        tradeExecution.onTradeExecuted = async (trade) => {
            addToSystemLog(`Trade executed: ${trade.direction} at $${trade.entryPrice}`);
            
            // Execute on antarctic exchange
            if (antarctic.isInitialized) {
                const tradeParams = {
                    type: trade.direction === 'long' ? 'BUY' : 'SELL',
                    pair: 'AVAX/USDT',
                    amount: trade.size,
                    price: trade.entryPrice,
                    leverage: timeframes.selectedLeverage
                };
                
                const result = await antarctic.executeTrade(tradeParams);
                
                if (result.success) {
                    addToSystemLog(`Trade confirmed on antarctic.exchange: ${result.trade.txHash}`);
                } else {
                    addToSystemLog(`Trade execution failed: ${result.error}`);
                }
            }
        };
        
        // Connect trade execution with risk management
        tradeExecution.onPositionClosed = (position) => {
            const plPercent = position.profitLoss;
            
            // Update daily P/L
            const result = timeframes.updateDailyPL(plPercent);
            updateDailyPLDisplay(timeframes.currentDailyPL);
            
            // Check if we hit daily loss limit
            if (result.shouldHalt) {
                stopTrading();
                addToSystemLog('ALERT: Daily loss limit reached. Trading halted.');
            }
            
            // Check if we hit profit target
            if (result.targetReached) {
                addToSystemLog('ALERT: Daily profit target reached!');
            }
        };
        
        // Connect wallet status with trading
        aiDebugger.onConnectionChanged = (connected) => {
            const startButton = document.getElementById('start-trading');
            
            if (connected) {
                startButton.disabled = false;
                addToSystemLog('Wallet connected. Trading enabled.');
            } else {
                startButton.disabled = true;
                stopTrading();
                addToSystemLog('Wallet disconnected. Trading disabled.');
            }
        };
    }
    
    /**
     * Set trading timeframe
     */
    function setTimeframe(timeframe) {
        const result = timeframes.setTimeframe(timeframe);
        
        if (result.success) {
            // Update UI
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const btnId = timeframe + '-btn';
            document.getElementById(btnId).classList.add('active');
            
            // Update details
            const details = result.timeframeDetails;
            document.getElementById('timeframe-description').textContent = details.description;
            document.getElementById('target-profit').textContent = details.targetProfit + '%';
            document.getElementById('stop-loss').textContent = details.stopLoss + '%';
            document.getElementById('max-trades').textContent = details.maxTradesPerDay;
            
            // Update leverage options
            updateLeverageOptions(details.leverageOptions, details.currentLeverage);
            
            // Update AI agent strategy
            if (aiAgent) {
                const strategyName = details.name;
                aiAgent.setStrategy(strategyName);
                addToSystemLog(`Strategy set to ${strategyName}`);
            }
        }
    }
    
    /**
     * Set leverage
     */
    function setLeverage(leverage) {
        const result = timeframes.setLeverage(leverage);
        
        if (result.success) {
            addToSystemLog(`Leverage set to ${leverage}x`);
        }
    }
    
    /**
     * Update leverage options based on timeframe
     */
    function updateLeverageOptions(options, currentLeverage) {
        const leverageSlider = document.getElementById('leverage-slider');
        const leverageButtons = document.querySelectorAll('.leverage-btn');
        
        // Update slider
        leverageSlider.min = options[0];
        leverageSlider.max = options[options.length - 1];
        leverageSlider.value = currentLeverage;
        document.getElementById('leverage-value').textContent = currentLeverage + 'x';
        
        // Update buttons
        leverageButtons.forEach(btn => {
            const value = parseInt(btn.getAttribute('data-value'));
            
            if (options.includes(value)) {
                btn.style.display = 'inline-block';
                
                if (value === currentLeverage) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } else {
                btn.style.display = 'none';
            }
        });
    }
    
    /**
     * Start automated trading
     */
    function startTrading() {
        // Check if wallet is connected
        if (!aiDebugger.isMetaMaskConnected) {
            addToSystemLog('Cannot start trading: Wallet not connected');
            return;
        }
        
        // Start trading
        const result = tradeExecution.startTrading();
        
        if (result.success) {
            // Update UI
            document.getElementById('start-trading').disabled = true;
            document.getElementById('stop-trading').disabled = false;
            
            // Reset daily P/L
            timeframes.resetDailyPL();
            updateDailyPLDisplay(0);
            
            addToSystemLog(`Automated trading started with ${result.timeframe} strategy and ${result.leverage} leverage`);
            
            // Start AI agent simulation for testing
            if (aiAgent) {
                aiAgent.startTradingSimulation();
            }
        }
    }
    
    /**
     * Stop automated trading
     */
    function stopTrading() {
        const result = tradeExecution.stopTrading();
        
        if (result.success) {
            // Update UI
            document.getElementById('start-trading').disabled = false;
            document.getElementById('stop-trading').disabled = true;
            
            addToSystemLog(`Automated trading stopped. Daily P/L: ${result.dailyPL}, Trades: ${result.tradesExecuted}`);
            
            // Stop AI agent simulation
            if (aiAgent) {
                aiAgent.stopTradingSimulation();
            }
        }
    }
    
    /**
     * Update daily P/L display
     */
    function updateDailyPLDisplay(plPercent) {
        const plElement = document.getElementById('daily-pl');
        const progressBar = document.getElementById('pl-progress-bar');
        
        if (plElement) {
            plElement.textContent = plPercent.toFixed(2) + '%';
            
            if (plPercent > 0) {
                plElement.className = 'text-success';
            } else if (plPercent < 0) {
                plElement.className = 'text-danger';
            } else {
                plElement.className = '';
            }
        }
        
        if (progressBar) {
            // Calculate width and color based on P/L
            const lossLimit = 10;
            const profitTarget = 20;
            const totalRange = lossLimit + profitTarget;
            
            // Normalize to 0-100% range
            const normalizedPL = ((plPercent + lossLimit) / totalRange) * 100;
            const clampedWidth = Math.max(0, Math.min(100, normalizedPL));
            
            progressBar.style.width = clampedWidth + '%';
            
            if (plPercent > 0) {
                progressBar.style.backgroundColor = '#28a745';
            } else if (plPercent < -lossLimit * 0.7) {
                progressBar.style.backgroundColor = '#dc3545';
            } else if (plPercent < 0) {
                progressBar.style.backgroundColor = '#ffc107';
            } else {
                progressBar.style.backgroundColor = '#6c757d';
            }
        }
    }
    
    /**
     * Add message to system log
     */
    function addToSystemLog(message) {
        const systemLog = document.getElementById('system-log');
        if (!systemLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const logTime = document.createElement('span');
        logTime.className = 'log-time';
        logTime.textContent = new Date().toLocaleTimeString();
        
        const logMessage = document.createElement('span');
        logMessage.textContent = message;
        
        logEntry.appendChild(logTime);
        logEntry.appendChild(logMessage);
        systemLog.appendChild(logEntry);
        
        // Scroll to bottom
        systemLog.scrollTop = systemLog.scrollHeight;
    }
});

// Add CSS styles
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .timeframe-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .timeframe-btn {
            flex: 1;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #4e74ff;
            background: transparent;
            color: white;
            cursor: pointer;
        }
        
        .timeframe-btn.active {
            background-color: #4e74ff;
        }
        
        .timeframe-details {
            margin-top: 10px;
        }
        
        .timeframe-details > div {
            margin-bottom: 5px;
        }
        
        .leverage-slider-container {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        #leverage-slider {
            flex: 1;
            margin-right: 10px;
        }
        
        #leverage-value {
            min-width: 40px;
            text-align: right;
        }
        
        .leverage-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 15px;
        }
        
        .leverage-btn {
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #4e74ff;
            background: transparent;
            color: white;
            cursor: pointer;
        }
        
        .leverage-btn.active {
            background-color: #4e74ff;
        }
        
        .leverage-warning {
            font-size: 12px;
            color: #ffc107;
        }
        
        .trading-controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .risk-management {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .risk-management h3 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .risk-management > div {
            margin-bottom: 5px;
        }
        
        .progress-container {
            height: 4px;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
            margin-top: 10px;
            overflow: hidden;
        }
        
        .progress-bar {
            height: 100%;
            width: 50%;
            background-color: #6c757d;
            transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .text-success {
            color: #28a745;
        }
        
        .text-danger {
            color: #dc3545;
        }
    `;
    
    document.head.appendChild(style);
});
