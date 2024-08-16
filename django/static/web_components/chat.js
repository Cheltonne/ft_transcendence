import { getUserFromStorage, getCookie, showToast } from '../utils.js';
import { UserChatView } from './chat_box.js';

export class ChatView extends HTMLElement {
    constructor() {
        super();
        this.users = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.loadUsers();
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

    render() {
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/chat_view.css'); // Assuming you have a CSS file

        this.shadowRoot.innerHTML = `
            <div class="chat-container">
                <div class="user-list">
                    <h2>Users</h2>
                    <ul id="userList">
                    </ul>
                </div>
                <div class="chat-box">
                </div>
            </div>
        `;

        this.shadowRoot.appendChild(styleLink);
    }

    renderUserList() {
        const userList = this.shadowRoot.querySelector('#userList');
        userList.innerHTML = this.users.map(user => `
            <li class="user-item" data-id="${user.id}">
                <img src="${user.profile_picture.replace('http://localhost/', '')}">
                <h2>${user.username}</h2>
                <button class="start-chat-button" data-id="${user.id}">Send Message</button>
            </li>
        `).join('');

        this.shadowRoot.querySelectorAll('.start-chat-button').forEach(button => {
            button.addEventListener('click', (event) =>{
                this.startChat(event.target.dataset.id)
        });
        });
    }

    async startChat(userId) {
        const user = this.users.find(u => u.id == userId);
        if (user) {
            const existingChatComponent = this.shadowRoot.querySelector('user-chat-view');
            if (existingChatComponent)
                existingChatComponent.remove();
            const chatComponent = document.createElement('user-chat-view');
            chatComponent.interlocutor = user;
            this.shadowRoot.querySelector('.chat-box').appendChild(chatComponent);
        }
    }
}

customElements.define('chat-view', ChatView);
