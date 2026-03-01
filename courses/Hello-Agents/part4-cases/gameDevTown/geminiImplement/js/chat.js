class Chat {
    constructor() {
        this.container = document.getElementById('chat-container');
        this.typingSpeed = 30; // ms per character
    }

    async streamMessage(speaker, avatar, content) {
        this.removeTypingIndicator();
        
        const messageEl = this.createMessageBubble(speaker, avatar);
        const textEl = messageEl.querySelector('.message-text');
        
        // Show who is speaking
        this.showTypingIndicator(`${speaker} 正在发言...`);

        for (const char of content) {
            textEl.textContent += char;
            this.scrollToBottom();
            await this.delay(this.typingSpeed);
        }
        
        this.removeTypingIndicator();
        this.showTypingIndicator('下一位发言者正在思考...');
    }

    createMessageBubble(speaker, avatar) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'chat-message';

        messageWrapper.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-speaker">${speaker}</div>
                <div class="message-text"></div>
            </div>
        `;
        
        this.container.appendChild(messageWrapper);
        return messageWrapper;
    }

    showTypingIndicator(text) {
        this.removeTypingIndicator(); // Ensure only one indicator at a time
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <span class="speaker">${text}</span>
            <span class="dots"><span>.</span><span>.</span><span>.</span></span>
        `;
        this.container.appendChild(indicator);
        this.scrollToBottom();
    }
    
    showSystemMessage(text) {
        this.removeTypingIndicator();
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `<span class="speaker">${text}</span>`;
        this.container.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = this.container.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clear() {
        this.container.innerHTML = '';
    }
}
