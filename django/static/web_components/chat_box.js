import { getCookie, showToast, getUserFromStorage } from "../utils.js";
import { navigateTo } from "../navigation.js";

export class UserChatView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleSendMessage = this.sendMessage.bind(this);
        const template = document.createElement('template');
        template.innerHTML = `
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" 
            integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
            crossorigin="anonymous">
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    max-height: 81vh;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                @media screen and (max-height: 1080px) {
                    :host {
                        max-height: 70vh;
                    }
                }
            </style>
            <div class="chat-container">
                <div class="chat-header">
                    <h3 id="chatWith">Chat</h3>
                    <div class="dropdown">
                        <button class="dropbtn">⋮</button>
                        <div id="dropdownMenu" class="dropdown-content" style="color: black; cursor: pointer;">
                            <a id="goToProfile" class="btn btn-primary">Go to User Profile</a>
                            <a id="blockUser" class="btn btn-danger">Block User</a>
                            <a id="unblockUser" class="btn btn-primary">Unblock User</a>
                        </div>
                    </div>

                </div>
                <div id="chatMessages" class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type your message here..."/>
                    <button id="sendMessageButton">Send</button>
                </div>
            </div>

            <div class="modal-backdrop" id="userProfileModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title text-center" id="modalUsername">User Profile</h2>
                        <button type="button" class="close" id="modalCloseButton">&times;</button>
                    </div>
                    <div class="modal-body">
                        <img id="modalProfilePicture" src="" alt="Profile Picture">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="viewProfileButton">View Profile</button>
                        <button type="button" class="btn btn-danger" id="blockUserButton">Block User</button>
                    </div>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/chat_box.css');
        this.shadowRoot.appendChild(styleLink);
        this._interlocutor = null;
        this.currentUser = getUserFromStorage();
        this.socket = new WebSocket('wss://' + window.location.host + '/ws/chat/');
    }

    connectedCallback() {
        this.setupEventListeners();
        this.setupWebSocketListeners();
        this.loadChatHistory();
        console.log(this._interlocutor.username, this._interlocutor.id)
    }

    disconnectedCallback() {
        this.socket.close();
    }

    set interlocutor(data) {
        this._interlocutor = data;
        if (this.shadowRoot) {
            this.shadowRoot.querySelector('#chatWith').textContent = `Chat with ${data.username}`;
        }
    }

    setupWebSocketListeners() {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.sender === this._interlocutor.username)
                    this.displayMessage(data.message, data.sender, data.timestamp, data.sender_id);
                else if (data.sender === 2)
                    this.displayTournamentNotice(data);
            };
        }
    }

    setupEventListeners() {
        const sendMessageButton = this.shadowRoot.querySelector('#sendMessageButton');
        const messageInput = this.shadowRoot.querySelector('#messageInput');
        const modalCloseButton = this.shadowRoot.querySelector('#modalCloseButton');
        const modalBackdrop = this.shadowRoot.querySelector('#userProfileModal');

        sendMessageButton.addEventListener('click', this.handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        modalCloseButton.addEventListener('click', () => {
            this.closeModal();
        });

        const dropdownButton = this.shadowRoot.querySelector('.dropbtn');
        const dropdownMenu = this.shadowRoot.querySelector('#dropdownMenu');

        dropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            if (dropdownMenu.classList.contains('show'))
                dropdownMenu.classList.remove('show');
        });

        const goToProfileButton = this.shadowRoot.querySelector('#goToProfile');
        const blockUserButton = this.shadowRoot.querySelector('#blockUser');
        const unblockUserButton = this.shadowRoot.querySelector('#unblockUser');

        goToProfileButton.addEventListener('click', () => {
            navigateTo('other-user-profile', 3, this._interlocutor.id);
        });

        unblockUserButton.addEventListener('click', () => {
            this.unblockUser(this._interlocutor.id);
        });

        blockUserButton.addEventListener('click', () => {
            this.blockUser(this._interlocutor.id);
        });
    }

    async loadChatHistory() {
        if (!this._interlocutor) return;
        try {
            const response = await fetch(`/accounts/messages/?recipient_id=${this._interlocutor.id}`, {
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
                    chatMessages.innerHTML =
                        '<div class="message no-messages">No messages yet. Start the conversation!</div>';
                } else {
                    messages.forEach(msg => {
                        this.displayMessage(msg.content, msg.sender, msg.timestamp, msg.sender_id);
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

    displayMessage(message, sender, timestamp, sender_id) {
        const chatMessages = this.shadowRoot.querySelector('#chatMessages');
        const messageElement = document.createElement('div');
        const isCurrentUser = sender === this.currentUser.username;
        let profilePictureUrl = isCurrentUser ? this.currentUser.profile_picture : this._interlocutor.profile_picture;
        if (profilePictureUrl.includes('intra.42.fr'))
            profilePictureUrl = profilePictureUrl.replace('media/https%3A/', 'https://');
        const regex = /http:\/\/made-[^\/]+\/?/;
        if (profilePictureUrl.match(regex))
            profilePictureUrl = profilePictureUrl.replace(regex, '');
        const pfp = profilePictureUrl.replace('http://localhost/', '');
        const username = isCurrentUser ? this.currentUser.username : sender;
        messageElement.classList.add('message', isCurrentUser ? 'sent' : 'received');
        const id = isCurrentUser ? this.currentUser.id : this._interlocutor.id;

        messageElement.innerHTML = `
            <div class="message-bubble">
                <img src="${pfp.replace('/http', 'http')}" 
                alt="profile picture" class="profile-picture">
                <strong class="sender-name">${username}</strong>
                <p class="message-text">${message}</p>
                <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
            </div>
        `;

        const profilePicture = messageElement.querySelector('.profile-picture');
        profilePicture.addEventListener('click', () => {
            this.openUserProfileModal(username, pfp, id);
            console.log(id)
        })

        const usernameElement = messageElement.querySelector('.sender-name');
        usernameElement.addEventListener('click', () => this.openUserProfileModal(username, pfp, id));

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    displayTournamentNotice(data)
    {
            const announcement = document.createElement('div');
            announcement.innerText = `Tournament Match: ${data.player1} VS ${data.player2}`;
            announcement.style.color = 'red';
            this.shadowRoot.querySelector('.chat-header').appendChild(announcement);
    }

    openUserProfileModal(username, pfp, id) {
        const modalBackdrop = this.shadowRoot.querySelector('#userProfileModal');
        const modalUsername = modalBackdrop.querySelector('#modalUsername');
        const modalProfilePicture = modalBackdrop.querySelector('#modalProfilePicture');
        const viewProfileButton = this.shadowRoot.querySelector('#viewProfileButton');
        const blockUserButton = this.shadowRoot.querySelector('#blockUserButton');

        modalUsername.textContent = username;
        modalProfilePicture.src = pfp;
        modalBackdrop.style.display = 'flex';
        const newViewProfileClickHandler = () => {
            if (id === this.currentUser.id) {
                navigateTo('user-profile', 1);
            } else {
                console.log("entering", id)
                navigateTo('other-user-profile', 3, id);
            }
        };

        const newBlockUserClickHandler = () => {
            this.blockUser(id);
            this.removeModalEventListeners(viewProfileButton, blockUserButton);
        };
        viewProfileButton.removeEventListener('click', this.viewProfileClickHandler);
        blockUserButton.removeEventListener('click', this.blockUserClickHandler);
        viewProfileButton.addEventListener('click', newViewProfileClickHandler);
        blockUserButton.addEventListener('click', newBlockUserClickHandler);

        // Store the handlers to remove them later necessary for some reason..
        this.viewProfileClickHandler = newViewProfileClickHandler;
        this.blockUserClickHandler = newBlockUserClickHandler;
        modalBackdrop.addEventListener('click', () => {
            this.closeModal();
        })
    }

    closeModal() {
        const modalBackdrop = this.shadowRoot.querySelector('#userProfileModal');
        modalBackdrop.style.display = 'none';
    }

    async blockUser(userId) {
        const username = this._interlocutor.username;
        userId = this._interlocutor.id;
        await fetch(`/accounts/users/${userId}/block-user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('token')}`,
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ username })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showToast(data.message, 'success');
                    this.loadChatHistory();
                }
                else
                    showToast(data.error, 'error');
            })
            .catch(error => {
                console.error('Error blocking user:', error);
                showToast('Error blocking user', 'error');
            })
    }

    async unblockUser(userId) {
        const username = this._interlocutor.username;
        await fetch(`/accounts/users/${userId}/unblock-user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('token')}`,
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ username })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showToast(data.message, 'success');
                    this.loadChatHistory();
                }
                else
                    showToast(data.error, 'error');
            })
            .catch(error => {
                console.error('Error unblocking user:', error);
                showToast('Error unblocking user', 'error');
            })
    }

    sendMessage() {
        const messageInput = this.shadowRoot.querySelector('#messageInput');
        const message = messageInput.value.trim();
        if (message && this._interlocutor) {
            const messageData = {
                recipient_id: this._interlocutor.id,
                sender_id: this.currentUser.id,
                message: message,
            };
            this.socket.send(JSON.stringify(messageData));
            this.displayMessage(message, this.currentUser.username, new Date().toISOString()), this.currentUser.id;
            messageInput.value = '';
        }
    }
}

customElements.define('user-chat-view', UserChatView);