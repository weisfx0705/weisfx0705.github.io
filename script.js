// 占星資料
const planets = [
    "太陽 (Sun)", "月亮 (Moon)", "水星 (Mercury)", "金星 (Venus)",
    "火星 (Mars)", "木星 (Jupiter)", "土星 (Saturn)", "天王星 (Uranus)",
    "海王星 (Neptune)", "冥王星 (Pluto)", "北交點 (North Node)", "南交點 (South Node)"
];

const zodiacSigns = [
    "白羊座 (Aries)", "金牛座 (Taurus)", "雙子座 (Gemini)", "巨蟹座 (Cancer)",
    "獅子座 (Leo)", "處女座 (Virgo)", "天秤座 (Libra)", "天蠍座 (Scorpio)",
    "射手座 (Sagittarius)", "摩羯座 (Capricorn)", "水瓶座 (Aquarius)", "雙魚座 (Pisces)"
];

const houses = [
    "第一宮", "第二宮", "第三宮", "第四宮", "第五宮", "第六宮",
    "第七宮", "第八宮", "第九宮", "第十宮", "第十一宮", "第十二宮"
];

// 在頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    // 獲取DOM元素
    const startButton = document.getElementById('startButton');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const voiceButton = document.getElementById('voiceButton');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKey');

    // API密鑰
    let apiKey = localStorage.getItem('openai_api_key') || '';
    
    // 如果有保存的 API KEY，顯示在輸入框中（用星號表示）
    if (apiKey) {
        apiKeyInput.value = '********';
    }

    // 保存 API KEY
    saveApiKeyButton.addEventListener('click', () => {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey && newApiKey !== '********') {
            apiKey = newApiKey;
            localStorage.setItem('openai_api_key', apiKey);
            apiKeyInput.value = '********';
            alert('OPENAI API KEY 已成功保存！');
        } else if (newApiKey === '') {
            alert('請輸入有效的 OPENAI API KEY！');
        }
    });

    // 語音識別相關變數
    let recognition = null;
    let isListening = false;
    let microphonePermissionGranted = false; // 新增: 追蹤麥克風權限狀態
    let speechRecognitionSupported = false;  // 新增: 追蹤瀏覽器是否真正支援語音識別
    
    let microphoneStatus = document.createElement('div');
    microphoneStatus.className = 'microphone-status';
    microphoneStatus.textContent = '點擊麥克風開始語音輸入';
    microphoneStatus.style.display = 'none';
    document.querySelector('.chat-input-container').insertBefore(microphoneStatus, document.querySelector('.input-buttons'));
    
    // 計時器相關變數
    let countdownTimer = null;
    let remainingTime = 30; // 30秒倒數
    let timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer-display';
    timerDisplay.style.display = 'none';
    document.querySelector('.chat-input-container').insertBefore(timerDisplay, document.querySelector('.input-buttons'));

    // 對話歷史記錄
    let chatHistory = [];
    
    // 創建並添加清空對話按鈕
    const clearButton = document.createElement('button');
    clearButton.id = 'clearButton';
    clearButton.className = 'clear-button';
    clearButton.innerHTML = '<i class="fas fa-trash"></i> 清空對話';
    document.querySelector('.chat-header').appendChild(clearButton);
    
    // 創建並添加 API Key 更新按鈕
    const apiKeyUpdateButton = document.createElement('button');
    apiKeyUpdateButton.id = 'apiKeyUpdateButton';
    apiKeyUpdateButton.className = 'api-key-update-button';
    apiKeyUpdateButton.innerHTML = '<i class="fas fa-key"></i> API Key';
    document.querySelector('.chat-header').appendChild(apiKeyUpdateButton);
    
    // API Key 更新按鈕點擊事件
    apiKeyUpdateButton.addEventListener('click', () => {
        const newApiKey = prompt('請輸入OpenAI的 API Key：');
        if (newApiKey && newApiKey.trim() !== '') {
            apiKey = newApiKey.trim();
            localStorage.setItem('openai_api_key', apiKey);
            alert('API Key 已成功更新！');
        }
    });
    
    // 點擊清空對話按鈕
    clearButton.addEventListener('click', () => {
        if (confirm('確定要重新開始對話嗎？')) {
            // 保留聊天容器，只清空消息
            chatMessages.innerHTML = '';
            chatHistory = [];
            // 重新發送初始問候語
            sendInitialGreeting();
        }
    });

    // 檢查瀏覽器對語音識別的支援
    function checkSpeechRecognitionSupport() {
        // 檢查是否支援 SpeechRecognition API
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('您的瀏覽器不支持語音識別 API');
            return false;
        }
        
        // 根據瀏覽器類型提供更具體的信息
        const userAgent = navigator.userAgent.toLowerCase();
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isEdge = userAgent.indexOf('edg') > -1;
        
        if (isSafari) {
            console.warn('Safari 瀏覽器可能對語音識別支援有限。建議使用 Chrome 以獲得最佳體驗。');
        } else if (isEdge) {
            console.warn('Edge 瀏覽器對語音識別的支援可能不完整。建議使用 Chrome 以獲得最佳體驗。');
        }
        
        return true;
    }

    // 請求麥克風權限
    function requestMicrophonePermission() {
        return new Promise((resolve, reject) => {
            if (microphonePermissionGranted) {
                // 如果已經授予了權限，直接返回成功
                resolve(true);
                return;
            }
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        // 獲取到權限，立即停止使用麥克風
                        const tracks = stream.getTracks();
                        tracks.forEach(track => track.stop());
                        microphonePermissionGranted = true; // 標記已獲得權限
                        resolve(true);
                    })
                    .catch(err => {
                        console.error('麥克風權限請求失敗:', err);
                        resolve(false);
                    });
            } else {
                console.warn('瀏覽器不支持 getUserMedia API');
                resolve(false);
            }
        });
    }

    // 設置語音識別，提前初始化
    function initSpeechRecognition() {
        // 檢查瀏覽器支援
        if (!checkSpeechRecognitionSupport()) {
            voiceButton.style.display = 'none';
            const inputButtonsContainer = document.querySelector('.input-buttons');
            sendButton.style.width = '100%';
            displayMessage('系統提示：您的瀏覽器不支持語音識別，請使用 Google Chrome 瀏覽器獲得最佳體驗。', 'bot');
            return false;
        }
        
        try {
            // 只創建一次 recognition 實例
            if (!recognition) {
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.continuous = true; // 設為持續模式
                recognition.interimResults = true; // 獲取中間結果
                recognition.lang = 'zh-TW'; // 設置為繁體中文
                
                recognition.onstart = () => {
                    isListening = true;
                    voiceButton.classList.add('active');
                    voiceButton.style.backgroundColor = '#4CAF50'; // 綠色
                    voiceButton.innerHTML = '<i class="fas fa-microphone-alt"></i>';
                    microphoneStatus.style.display = 'block';
                    microphoneStatus.textContent = '正在聆聽...（再次點擊麥克風或點擊發送按鈕停止）';
                    microphoneStatus.style.color = '#4CAF50';
                    
                    // 啟動計時器
                    startCountdown();
                };
                
                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    
                    // 更新輸入框
                    if (finalTranscript !== '') {
                        userInput.value = finalTranscript;
                    } else {
                        userInput.value = interimTranscript;
                    }
                };
                
                recognition.onerror = (event) => {
                    console.error('語音識別錯誤:', event.error);
                    stopListening();
                    
                    // 根據錯誤類型顯示不同的提示
                    if (event.error === 'not-allowed') {
                        displayMessage('系統提示：麥克風權限被拒絕。請在瀏覽器設置中允許訪問麥克風。', 'bot');
                        microphonePermissionGranted = false; // 重置權限狀態
                    } else if (event.error === 'no-speech') {
                        displayMessage('系統提示：未檢測到語音。請靠近麥克風並確保它正常工作。', 'bot');
                    } else {
                        displayMessage('系統提示：語音識別發生錯誤，請嘗試使用文字輸入。', 'bot');
                    }
                };
                
                recognition.onend = () => {
                    if (isListening) {
                        // 如果仍處於監聽狀態但recognition結束了，則重新啟動
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('重新啟動語音識別失敗:', e);
                            resetMicrophoneButton();
                        }
                    } else {
                        resetMicrophoneButton();
                    }
                };
            }
            
            // 驗證Speech Recognition是否真正可用
            speechRecognitionSupported = true;
            return true;
        } catch (error) {
            console.error('初始化語音識別失敗:', error);
            voiceButton.style.display = 'none';
            const inputButtonsContainer = document.querySelector('.input-buttons');
            sendButton.style.width = '100%';
            displayMessage('系統提示：初始化語音識別失敗。請使用 Google Chrome 瀏覽器獲得最佳體驗。', 'bot');
            speechRecognitionSupported = false;
            return false;
        }
    }

    // 啟動倒數計時
    function startCountdown() {
        // 重置計時器
        clearInterval(countdownTimer);
        remainingTime = 30;
        
        // 顯示計時器
        timerDisplay.style.display = 'block';
        updateTimerDisplay();
        
        // 啟動計時器
        countdownTimer = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            
            if (remainingTime <= 0) {
                // 時間到，停止語音識別
                stopListening();
                clearInterval(countdownTimer);
            }
        }, 1000);
    }
    
    // 更新計時器顯示
    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.innerHTML = `<i class="fas fa-clock"></i> ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // 當時間小於10秒時，添加紅色警示
        if (remainingTime <= 10) {
            timerDisplay.style.color = '#ff4d4d';
        } else {
            timerDisplay.style.color = '#4CAF50';
        }
    }

    // 停止監聽函數
    function stopListening() {
        if (recognition && isListening) {
            isListening = false;
            try {
                recognition.stop();
            } catch (e) {
                console.error('停止語音識別失敗:', e);
            }
            
            // 停止計時器
            clearInterval(countdownTimer);
            timerDisplay.style.display = 'none';
            
            // 清空輸入框
            userInput.value = '';
        }
    }

    // 重置麥克風按鈕
    function resetMicrophoneButton() {
        isListening = false;
        voiceButton.classList.remove('active');
        voiceButton.style.backgroundColor = ''; // 恢復原來的顏色
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        microphoneStatus.style.display = 'none';
        timerDisplay.style.display = 'none';
    }

    // 點擊開始按鈕
    startButton.addEventListener('click', () => {
        if (!apiKey) {
            alert('請先設置 API KEY！');
            return;
        }
        welcomeScreen.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // 只初始化語音識別，不要立即請求權限
        initSpeechRecognition();
        
        // 發送初始問候
        sendInitialGreeting();
    });

    // 發送初始問候
    function sendInitialGreeting() {
        const introMessage = "厭世女巫：\n『歡迎，雖然我猜你也不會得到什麼驚天動地的啟示。讓我先提醒你，這裡的占卜完全隨機，我會從12個行星、12個星座和12個宮位裡擲出三顆骰子，不管你問了什麼，這些結果都隨機得像是宇宙對你的嘲笑。沒錯，沒人會特別照顧你的問題，因為命運本身也不會理你。放輕鬆，準備接受這些骰子所謂的啟示吧，無論好壞，日子還是得繼續過下去。』\n\n『好了，說出你要占卜什麼問題吧！』";
        
        displayMessage(introMessage, 'bot');
        
        // 初始化對話歷史，添加系統說明
        chatHistory = [
            {
                role: 'system',
                content: `你是一個厭世女巫的占星師。你扮演一個非常厭世、嘲諷的占星師角色，在每次對話中都會帶有濃厚的嘲諷和戲謔成分。

當用戶提問時，你需要根據隨機擲出的骰子結果進行解讀。你的回覆應該包含以下内容：
1. 首先，告訴用戶你擲出的骰子號碼和對應的行星、星座和宮位
2. 然後，結合用戶的問題，以厭世女巫的口吻提供占卜解讀
3. 行星代表「什麼」（事件核心或能量）
4. 星座代表「如何」（表現方式）
5. 宮位代表「哪裡」（影響的生活領域）
6. 最後提供總結和建議，但保持厭世和嘲諷的口吻

保持角色一致性，不要跳出厭世女巫角色。請使用繁體中文回覆。`
            }
        ];
    }

    // 發送用戶消息
    function sendUserMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // 顯示用戶消息
        displayMessage(message, 'user');
        
        // 清空輸入框
        userInput.value = '';
        
        // 添加到對話歷史
        chatHistory.push({
            role: 'user',
            content: message
        });
        
        // 停止語音輸入（如果正在進行）
        stopListening();
        
        // 顯示加載指示器
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatMessages.appendChild(loadingElement);
        
        // 將聊天區域滾動到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 發送到機器人
        sendToBot(message, loadingElement);
    }

    // 顯示消息
    function displayMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        // 處理換行
        content = content.replace(/\n/g, '<br>');
        
        messageElement.innerHTML = content;
        chatMessages.appendChild(messageElement);
        
        // 將聊天區域滾動到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 生成隨機占星骰子結果
    function generateRandomDiceResults() {
        const planetIndex = Math.floor(Math.random() * 12);
        const signIndex = Math.floor(Math.random() * 12);
        const houseIndex = Math.floor(Math.random() * 12);
        
        return {
            planet: {
                number: planetIndex + 1,
                name: planets[planetIndex]
            },
            sign: {
                number: signIndex + 1,
                name: zodiacSigns[signIndex]
            },
            house: {
                number: houseIndex + 1,
                name: houses[houseIndex]
            }
        };
    }

    // 發送到機器人
    async function sendToBot(message, loadingElement) {
        // 生成隨機骰子結果
        const diceResults = generateRandomDiceResults();
        
        // 創建系統提示，包含骰子結果
        const systemPrompt = `你現在要根據以下隨機擲出的占星骰子來解讀用戶的問題，並善用表情符號豐富文字：
行星（號碼：${diceResults.planet.number}）：${diceResults.planet.name}
星座（號碼：${diceResults.sign.number}）：${diceResults.sign.name}
宮位（號碼：${diceResults.house.number}）：${diceResults.house.name}

你的回覆應該包含以下内容：
1. 首先，告訴用戶你擲出的骰子號碼和對應的行星、星座和宮位
2. 然後，結合用戶的問題，以厭世女巫的口吻提供占卜解讀
3. 行星代表「什麼」（事件核心或能量）
4. 星座代表「如何」（表現方式）
5. 宮位代表「哪裡」（影響的生活領域）
6. 最後提供總結和建議，但保持厭世和嘲諷的口吻

請保持厭世女巫的角色，使用繁體中文回覆。`;

        // 添加當前的系統提示到歷史記錄中，替換之前的系統消息
        // 保留之前的系統指令，但加入新的骰子結果
        chatHistory[0].content = chatHistory[0].content.split('當用戶提問時')[0] + systemPrompt;
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: chatHistory,
                    temperature: 0.7,
                    max_tokens: 3000
                })
            });
            
            // 移除加載指示器
            loadingElement.remove();
            
            if (!response.ok) {
                throw new Error('API請求失敗: ' + response.statusText);
            }
            
            const data = await response.json();
            const botReply = data.choices[0].message.content;
            
            // 顯示機器人回覆
            displayMessage(botReply, 'bot');
            
            // 添加到對話歷史
            chatHistory.push({
                role: 'assistant',
                content: botReply
            });
            
        } catch (error) {
            console.error('錯誤:', error);
            loadingElement.remove();
            displayMessage('發生錯誤：' + error.message + '。請檢查網絡連接或刷新頁面重試。', 'bot');
        }
    }

    // 監聽發送按鈕
    sendButton.addEventListener('click', sendUserMessage);
    
    // 監聽Enter鍵
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    
    // 監聽語音按鈕
    voiceButton.addEventListener('click', () => {
        if (isListening) {
            // 如果已經在監聽，點擊即停止
            stopListening();
        } else {
            // 在開始新的語音識別前，先請求權限
            requestMicrophonePermission().then(hasPermission => {
                if (!hasPermission) {
                    displayMessage('系統提示：要使用語音輸入功能，請允許麥克風權限。', 'bot');
                    return;
                }
                
                // 開始新的語音識別
                userInput.value = ''; // 清空輸入框
                
                // 檢查是否支持語音識別
                if (!speechRecognitionSupported) {
                    displayMessage('系統提示：您的瀏覽器不完全支持語音識別。建議使用 Google Chrome 瀏覽器獲得最佳體驗。', 'bot');
                    return;
                }
                
                try {
                    recognition.start();
                } catch (e) {
                    console.error('啟動語音識別失敗:', e);
                    
                    // 如果啟動失敗，嘗試重新初始化
                    if (initSpeechRecognition()) {
                        try {
                            recognition.start();
                        } catch (err) {
                            console.error('重新嘗試啟動語音識別也失敗:', err);
                            displayMessage('系統提示：無法啟動語音識別，請重新載入頁面再試。', 'bot');
                        }
                    }
                }
            });
        }
    });
}); 