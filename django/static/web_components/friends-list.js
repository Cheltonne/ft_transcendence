import { getFriends, addFriend, removeFriend, getUserByUsername } from "../user_utils.js";
import { socket } from "../utils.js";

export class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.friends = [];
        this.onlineFriends = new Set();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.loadFriends();
        this.setupWebSocketListeners(); // New method to set up WebSocket listeners
    }

    async loadFriends() {
        try {
            this.friends = await getFriends();
            this.friends.forEach(friend => {
                if (friend.is_online)
                    this.onlineFriends.add(friend.username);
            })
            this.render();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    setupWebSocketListeners() {
        if (socket) {
            socket.onmessage = (event) => {
                console.log('socket opened.');
                const data = JSON.parse(event.data);
                console.log(data);
                if (data.type === 'user_list') {
                    this.onlineFriends = new Set(data.friends_online);
                    this.loadFriends();
                    console.log('New friend online');
                } else if (data.type === 'user_status_change') {
                    console.log('status update caught');
                    const { username, is_online } = data;
                    this.loadFriends();
                    if (is_online) {
                        this.onlineFriends.add(username);
                    } else {
                        this.onlineFriends.delete(username);
                        this.onlineFriends = new Set(data.friends_online);
                        console.log(data.username + ' is offline.');
                    }
                }
                this.render();
            };
            socket.onclose = async (e) => {
                console.log('socket closed.')
                await this.loadFriends();
            }
        }
    }

    render() {
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/friends_list.css');
        this.shadowRoot.innerHTML = `
            <div class="friends-container">
                <h2>Friends</h2>
                <ul>
                    ${this.friends.map(friend =>
                        `<li class="friend-card">
                            <img src="${friend.profile_picture.replace('http://localhost/', '')}" alt="Profile Picture"></img>
                            ${friend.username} 
                            <span class="status ${friend.is_online ? 'online' : 'offline'}"></span>
                            <button data-id="${friend.id}" class="remove-friend">Remove</button>
                        </li>`
                    ).join('')}
                </ul>
                <input type="text" id="new-friend-username" placeholder="Add a friend by username">
                <button id="add-friend-button">Add Friend</button>
            </div>
        `;
        this.addEventListeners();
        this.shadowRoot.appendChild(styleLink);
    }

    addEventListeners() {
        this.shadowRoot.querySelector('#add-friend-button').addEventListener('click', () => this.addFriend());
        this.shadowRoot.querySelectorAll('.remove-friend').forEach(button => {
            button.addEventListener('click', event => this.removeFriend(event.target.dataset.id));
        });
    }

    async addFriend() {
        const username = this.shadowRoot.querySelector('#new-friend-username').value;
        const user = await getUserByUsername(username);
        if (user) {
            await addFriend(user.id);
            await this.loadFriends(); // Reload friends list after adding friend
        } else {
            console.log('User search failed');
        }
    }

    async removeFriend(userId) {
        await removeFriend(userId);
        await this.loadFriends(); // Reload friends list after removing friend
    }
}

customElements.define('friends-view', FriendsComponent);
