import { getUserFromStorage, getCookie, showToast } from '../utils.js';
import { navigateTo } from '../views.js';

export class ChatView extends HTMLElement {
    constructor() {
        super();
        this.users = [];
        this.activeChatUser = null;
        this.socket = new WebSocket('wss://' + window.location.host + '/ws/chat/');
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.loadUsers();
        this.render();
        this.setupWebSocketListeners();
    }

    async loadUsers() {
        try {
            const response = await fetch('/accounts/users/users_except_current/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}` // Adjust for your auth method
                }
            });
            if (response.ok) {
                this.users = await response.json();
                this.renderUserList();
            } else {
                showToast('Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showToast('Error loading users', 'error');
        }
    }

    setupWebSocketListeners() {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (this.activeChatUser && data.sender === this.activeChatUser.username)
                    this.displayMessage(data.message, data.sender, data.sender_profile_picture, data.timestamp);
            };
        }
    }

    render() {
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/chat_view.css');

        this.shadowRoot.innerHTML = `
        <div class="chat-container">
            <div class="user-list">
                <h2>Users</h2>
                <ul id="userList">
                    <!-- User list will be populated here -->
                </ul>
            </div>
            <div class="chat-box">
                <div id="chatHeader" class="chat-header">
                    <h3 id="chatWith">Select a user to chat</h3>
                </div>
                <div id="chatMessages" class="chat-messages">
                    <!-- Chat messages will be displayed here -->
                </div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type your message here..."/>
                    <button id="sendMessageButton">Send</button>
                </div>
            </div>
        </div>
        <div id="userProfileModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-body">
                    <img id="modalProfilePicture" src="" alt="Profile Picture" class="modal-profile-picture">
                    <h3 id="modalUsername"></h3>
                    <button id="viewProfileButton">View Profile</button>
                    <button id="blockUserButton">Block User</button>
                </div>
            </div>
        </div>
    `;

        this.shadowRoot.appendChild(styleLink);
        this.addEventListeners();
    }


    renderUserList() {
        const userList = this.shadowRoot.querySelector('#userList');
        userList.innerHTML = this.users.map(user => `
            <li class="user-item" data-id="${user.id}">
                ${user.username}
                <button class=
                "start-chat-button" data-id="${user.id}">Send Message</button>
            </li>
        `).join('');

        this.shadowRoot.querySelectorAll('.start-chat-button').forEach(button => {
            button.addEventListener('click', (event) =>
                this.startChat(event.target.dataset.id));
        });
    }

    async startChat(userId) {
        const user = this.users.find(u => u.id == userId);
        if (user) {
            this.activeChatUser = user;
            this.shadowRoot.querySelector('#chatWith').textContent =
                `Chat with ${user.username}`;
            this.loadChatHistory(user.id);
        }
    }

    async loadChatHistory(userId) {
        try {
            const user = getUserFromStorage();
            const response = await
                fetch(`/accounts/messages/?recipient_id=${userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getCookie('token')}`
                    }
                });
            if (response.ok) {
                const messages = await response.json();
                const chatMessages = this.shadowRoot.querySelector('#chatMessages');
                chatMessages.innerHTML = '';
                if (messages.length === 0) {
                    chatMessages.innerHTML =
                        `<div class="message no-messages">No messages yet. 
                    Start the conversation!</div>`;
                } else {
                    messages.forEach((msg) => {
                        const isCurrentUser = msg.sender === user.username;
                        const messageElement = document.createElement('div');
                        messageElement.classList.add('message', isCurrentUser ? 'sent' : 'received');

                        messageElement.innerHTML = `
                            <div class="message-bubble">
                                <div class="message-info">
                                    <img src="${msg.sender_profile_picture.replace('http://localhost/', '')}" alt="${msg.sender}" class="profile-picture">
                                    <strong class="sender-name">${msg.sender}</strong>
                                </div>
                                <p class="message-text">${msg.content}</p>
                                <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
                            </div>
                        `
                        chatMessages.appendChild(messageElement);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        const profilePicture = messageElement.querySelector('.profile-picture');
                        const usernameElement = messageElement.querySelector('.sender-name');

                        profilePicture.addEventListener('click', () => this.openUserProfileModal(
                            msg.sender, msg.sender_profile_picture.replace('http://localhost/', '')));
                        usernameElement.addEventListener('click', () => this.openUserProfileModal(
                            msg.sender, msg.sender_profile_picture.replace('http://localhost/', '')));
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

    addEventListeners() {
        this.shadowRoot.querySelector('#sendMessageButton').addEventListener('click',
            () => this.sendMessage());
        this.shadowRoot.querySelector('#messageInput').addEventListener('keypress',
            (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
    }

    sendMessage() {
        const messageInput = this.shadowRoot.querySelector('#messageInput');
        const message = messageInput.value.trim();
        if (message && this.activeChatUser) {
            const user = getUserFromStorage();
            const messageData = {
                recipient_id: this.activeChatUser.id,
                message: message,
            };
            this.socket.send(JSON.stringify(messageData));
            this.displayMessage(message, user.username, user.profile_picture, new Date().toISOString());
            console.log(user)
            messageInput.value = '';
        }
    }

    displayMessage(message, sender, sender_profile_picture, timestamp) {
        const chatMessages = this.shadowRoot.querySelector('#chatMessages');
        const user = getUserFromStorage();
        const isCurrentUser = sender === user.username;

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isCurrentUser ? 'sent' : 'received');

        messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-info">
                <img src="${sender_profile_picture.replace('http://localhost/', '')}" alt="${sender}" class="profile-picture">
                <strong class="sender-name">${sender}</strong>
            </div>
            <p class="message-text">${message}</p>
            <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
        </div>
    `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const profilePicture = messageElement.querySelector('.profile-picture');
        const usernameElement = messageElement.querySelector('.sender-name');

        profilePicture.addEventListener('click', () => this.openUserProfileModal(sender, sender_profile_picture));
        usernameElement.addEventListener('click', () => this.openUserProfileModal(sender, sender_profile_picture));
    }

    openUserProfileModal(username, profilePictureUrl) {
        console.log('breakpoint')
        const modal = this.shadowRoot.querySelector('#userProfileModal');
        const modalProfilePicture = this.shadowRoot.querySelector('#modalProfilePicture');
        const modalUsername = this.shadowRoot.querySelector('#modalUsername');

        modalProfilePicture.src = profilePictureUrl;
        modalUsername.textContent = username;

        modal.style.display = 'block';

        const closeButton = this.shadowRoot.querySelector('.close');
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        this.shadowRoot.addEventListener('click', (event) => {
            if (event.target === modal)
                modal.style.display = 'none';
        });

        this.shadowRoot.querySelector('#viewProfileButton').addEventListener('click', () => {
            this.navigateToUserProfile(username);
        });

        this.shadowRoot.querySelector('#blockUserButton').addEventListener('click', () => {
            this.blockUser(username);
        });
    }

    navigateToUserProfile(username) {
        navigateTo('other-user-profile', 1);
        console.log(`Navigating to profile of ${username}`);
    }

    async blockUser(username) {
        try {
            const response = await fetch(`/accounts/users/block-user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                showToast(`${username} has been blocked.`, 'success');
                this.shadowRoot.querySelector('#userProfileModal').style.display = 'none';
            } else {
                showToast('Failed to block user', 'error');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            showToast('Error blocking user', 'error');
        }
    }
}

customElements.define('chat-view', ChatView);
