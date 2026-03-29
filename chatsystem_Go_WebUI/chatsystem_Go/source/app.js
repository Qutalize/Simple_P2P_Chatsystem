const ws = new WebSocket(`ws://${window.location.host}/ws`);
const messageArea = document.getElementById('messageArea');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const targetId = document.getElementById('targetId');
const stampToggleBtn = document.getElementById('stampToggleBtn');
const stampPalette = document.getElementById('stampPalette');
const stampMap = {
    'happy': 'stamp/happy.png',
    'ok': 'stamp/OK.png',  
    'sad': 'stamp/sad.png' 
};

function initStampPalette() {
    for (const [id, url] of Object.entries(stampMap)) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = id;
        
        // スタンプ画像がクリックされた時の処理
        img.onclick = function() {
            sendStamp(id); // スタンプを送信
            stampPalette.classList.add('hidden'); // 送信後はパレットを閉じる
        };
        stampPalette.appendChild(img);
    }
}
initStampPalette();

// スタンプボタンを押した時のパレット開閉処理
stampToggleBtn.onclick = function() {
    stampPalette.classList.toggle('hidden');
};

ws.onopen = function() {
    console.log("[WS] サーバーとの接続が確立しました");
};

ws.onmessage = function(event) {
    const data = event.data;

    if (typeof data === 'string' && data.startsWith("INIT:")) {
        const ip = data.replace("INIT:", "");
        targetId.textContent = ip;
        return; 
    }

    try {
        const receivedMessage = JSON.parse(data);
        if (receivedMessage.type === 'stamp') {
            addMessage(receivedMessage.stampId, 'other', 'stamp');
        } else if (receivedMessage.type === 'text') {
            addMessage(receivedMessage.content, 'other', 'text');
        }
    } catch (error) {
        addMessage(data, 'other', 'text');
    }
};

// --- 送信処理の分割 ---

// テキスト送信（ボタン or Enterキー）
sendBtn.onclick = sendTextMessage;
input.onkeypress = function(event) {
    if (event.key === 'Enter') {
        sendTextMessage();
    }
};
function sendTextMessage() {
    const text = input.value.trim();
    if (text === '') return;
    
    // 【復活・改良】先頭が「@」で始まり、その後ろの文字がスタンプIDとして存在するか確認
    if (text.startsWith('@')) {
        const stampId = text.substring(1); // 先頭の "@" を切り取る（例: "@sad" -> "sad"）
        
        // stampMapにそのIDが存在すれば、スタンプとして送信
        if (stampMap[stampId]) {
            sendStamp(stampId); // すでに作ったスタンプ送信用の関数を使い回す
            input.value = '';
            return; // テキスト送信処理はここでストップ
        }
    }

    // スタンプコマンドではない（または存在しないスタンプだった）場合は通常のテキストとして送信
    console.log("[WS送信] テキストを送信します:", text);
    const messageToSend = { type: 'text', content: text };
    addMessage(text, 'mine', 'text');
    ws.send(JSON.stringify(messageToSend)); 
    input.value = '';
}

// スタンプ送信（パレットから画像をクリック）
function sendStamp(stampId) {
    console.log("[WS送信] スタンプを送信します:", stampId);
    const messageToSend = { type: 'stamp', stampId: stampId };
    addMessage(stampId, 'mine', 'stamp');
    ws.send(JSON.stringify(messageToSend)); 
}

// 画面への描画処理
function addMessage(content, type, contentType) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${type}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (contentType === 'stamp') {
        const stampImg = document.createElement('img');
        const stampUrl = stampMap[content];
        if (stampUrl) {
            stampImg.src = stampUrl;
            bubble.classList.add('stamp-bubble'); 
            bubble.appendChild(stampImg);
        }
    } else {
        bubble.textContent = content;
    }
    
    wrapper.appendChild(bubble);
    messageArea.appendChild(wrapper);
    messageArea.scrollTop = messageArea.scrollHeight; 
}