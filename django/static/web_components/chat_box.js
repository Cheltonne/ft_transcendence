import { getCookie, showToast, getUserFromStorage, generateRandomString } from "../utils.js";
import { navigateTo } from "../views.js";
import { OnlineInvite } from "../game/pong.js";

export class UserChatView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleSendMessage = this.sendMessage.bind(this);
        const template = document.createElement('template');
        this.activeInvitation = false;
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
                            <a id="goToProfile">Go to User Profile</a>
                            <a id="Online">Online</a>
                            <a id="unblockUser">Unblock User</a>
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
                this.displayMessage(data.message, data.sender, data.timestamp, data.sender_id, data.id);
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
        const unblockUserButton = this.shadowRoot.querySelector('#unblockUser');
        const OnlineButton = this.shadowRoot.querySelector('#Online');

        goToProfileButton.addEventListener('click', () => {
            navigateTo('other-user-profile', 3, this._interlocutor.id);
        });

        OnlineButton.addEventListener('click', () => {
            if (this.activeInvitation) {
                showToast('An invitation is already active', 'warning');
                return;
            }

            this.activeInvitation = true;
            console.log(this.activeInvitation);

            const roomCode = generateRandomString(); // Generate the room code
            const messageInput = this.shadowRoot.querySelector('#messageInput');
            messageInput.value = `Pong Invite: ${roomCode}`; // Set the Pong invite message in the input
        
            //navigateTo('pong', 1);
            //OnlineInvite(this._interlocutor.username, this.currentUser.username, roomCode);
        
            this.sendMessage(); 
        });

        unblockUserButton.addEventListener('click', () => {
            this.unblockUser();
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
                        if	(msg.is_read === false)
                            this.displayMessage(msg.content, msg.sender, msg.timestamp, msg.sender_id, msg.id);
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

    async displayMessage(message, sender, timestamp, sender_id, clicked_id) {
        const chatMessages = this.shadowRoot.querySelector('#chatMessages');
        const messageElement = document.createElement('div');
        const isCurrentUser = sender === this.currentUser.username;
        const pfp = isCurrentUser ? this.currentUser.profile_picture.replace('http://localhost/', '') :
            this._interlocutor.profile_picture.replace('http://localhost/', '');
        const username = isCurrentUser ? this.currentUser.username : sender;
        messageElement.classList.add('message', isCurrentUser ? 'sent' : 'received');
        const id = isCurrentUser ? this.currentUser.id : this._interlocutor.id;
    

        if (message.startsWith("Pong Invite: ")) {
            const roomCode = message.split("Pong Invite: ")[1];
            this.activeInvitation = true;


    
            messageElement.innerHTML = `
                <div class="message-bubble invite">
                    <img src="${pfp}" 
                    alt="profile picture" class="profile-picture">
                    <strong class="sender-name">${username}</strong>
                    <p class="message-text">Click here to join Pong room ${roomCode.slice(0, 5)}</p>
                    <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                </div>
            `;
    
            const inviteBubble = messageElement.querySelector('.message-bubble.invite');
            inviteBubble.style.cursor = 'pointer';
            
            inviteBubble.addEventListener('click', () => {
            if (sender !== this.currentUser.username)
            {
                fetch(`/accounts/is_clicked/`, {
                    body: JSON.stringify({ clicked_id }),
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getCookie('token')}`,
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                });
            }
            this.activeInvitation = false;
            inviteBubble.style.cursor = 'default';
            inviteBubble.querySelector('.message-text').innerText = 'Pong invite clicked';
            navigateTo('pong', 1);
            OnlineInvite(this._interlocutor.username, this.currentUser.username, roomCode);
            });
        } else {
            messageElement.innerHTML = `
                <div class="message-bubble">
                    <img src="${pfp}" 
                    alt="profile picture" class="profile-picture">
                    <strong class="sender-name">${username}</strong>
                    <p class="message-text">${message}</p>
                    <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                </div>
            `;
        }
    
        const profilePicture = messageElement.querySelector('.profile-picture');
        profilePicture.addEventListener('click', () => {
            this.openUserProfileModal(username, pfp, id);
        });
    
        const usernameElement = messageElement.querySelector('.sender-name');
        usernameElement.addEventListener('click', () => this.openUserProfileModal(username, pfp, id));
    
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
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
        console.log(`Blocking user with ID: ${userId}`);
        await fetch(`accounts/users/${userId}/block-user/`);
    }

    async unblockUser(userId) {
        console.log(`Unblocking user with ID: ${userId}`);
        await fetch(`accounts/users/${userId}/unblock-user/`);
    }

    async blockUser(userId) {
        const username = this._interlocutor.username; 
        try {
            const response = await fetch(`/accounts/users/${userId}/block-user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                showToast(`${username} has been blocked.`, 'success');
            } else {
                showToast('Failed to block user', 'error');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            showToast('Error blocking user', 'error');
        }
    }

    async unblockUser(userId) {
        const username = this._interlocutor.username; 
        try {
            const response = await fetch(`/accounts/users/${userId}/unblock-user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                showToast(`${username} has been unblocked.`, 'success');
            } else {
                showToast('Failed to unblock user', 'error');
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            showToast('Error unblocking user', 'error');
        }
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

