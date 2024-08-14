import { getCookie, showToast, getUserFromStorage } from "../utils.js";
import { navigateTo } from "../views.js";

export class UserChatView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleSendMessage = this.sendMessage.bind(this);
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    max-height: 81vh; /* Default max height */
                }

                @media screen and (max-height: 1080px) {
                    :host {
                        max-height: 70vh; /* Adjusted max height for 1080p or smaller */
                    }
                }
            </style>
            <div class="chat-container">
                <div class="chat-header">
                    <h3 id="chatWith">Chat</h3>
                </div>
                <div id="chatMessages" class="chat-messages">
                </div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type your message here..."/>
                    <button id="sendMessageButton">Send</button>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/chat_box.css');
        this.shadowRoot.appendChild(styleLink);
        this._userData = null;
        this.socket = new WebSocket('wss://' + window.location.host + '/ws/chat/');
    }

    connectedCallback() {
        this.setupEventListeners();
        this.setupWebSocketListeners();
        this.loadChatHistory(); 
    }

    set userData(data) {
        this._userData = data;
        if (this.shadowRoot)
            this.shadowRoot.querySelector('#chatWith').textContent = `Chat with ${data.username}`;
    }

    setupWebSocketListeners() {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.displayMessage(data.message, data.sender, data.timestamp);
            };
        }
    }

    setupEventListeners() {
        const sendMessageButton = this.shadowRoot.querySelector('#sendMessageButton');
        const messageInput = this.shadowRoot.querySelector('#messageInput');

        sendMessageButton.addEventListener('click', this.handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async loadChatHistory() {
        if (!this._userData) return;
        try {
            const response = await fetch(`/accounts/messages/?recipient_id=${this._userData.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`
                }
            });
            const chatMessages = this.shadowRoot.querySelector('#chatMessages');
            chatMessages.innerHTML = '';

            if (response.ok) {
                const messages = await response.json();
                if (messages.length === 0) {
                    chatMessages.innerHTML = '<div class="message no-messages">No messages yet. Start the conversation!</div>';
                } else {
                    messages.forEach(msg => {
                        this.displayMessage(msg.content, msg.sender, msg.timestamp);
                    });
                }
            } else {
                showToast('Failed to load chat history', 'error');
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            showToast('Error loading chat history', 'error');
        }
    }

    sendMessage() {
        const messageInput = this.shadowRoot.querySelector('#messageInput');
        const message = messageInput.value.trim();
        const currentUser = getUserFromStorage();
        if (message && this._userData) {
            const messageData = {
                recipient_id: this._userData.id,
                message: message,
            };
            this.socket.send(JSON.stringify(messageData));
            this.displayMessage(message, currentUser.username, new Date().toISOString());
            messageInput.value = '';
        }
    }

    displayMessage(message, sender, timestamp) {
        const chatMessages = this.shadowRoot.querySelector('#chatMessages');
        const messageElement = document.createElement('div');
        const currentUser = getUserFromStorage();
        const isCurrentUser = sender === currentUser.username;
        messageElement.classList.add('message', isCurrentUser ? 'sent' : 'received');

        messageElement.innerHTML = `
        <div class="message-bubble">
            <img src="${isCurrentUser ? currentUser.profile_picture.replace('http://localhost/', '') :
                this._userData.profile_picture.replace('http://localhost/', '')}" 
            alt="${sender}" class="profile-picture">
            <strong class="sender-name">${isCurrentUser ? currentUser.username
                : sender}</strong>
            <p class="message-text">${message}</p>
            <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
        </div>
    `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

customElements.define('user-chat-view', UserChatView);
