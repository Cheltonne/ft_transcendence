import { getFriends, addFriend, removeFriend, getUserByUsername } from "../user_utils.js";
import { socket, getCookie, showToast } from "../utils.js";

export class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.friends = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.loadFriends();
        this.setupWebSocketListeners();
        console.log(`reload-${this.tagName.toLowerCase()}`);
        window.addEventListener(`reload-${this.tagName.toLowerCase()}`, () => {
            this.loadFriends();
        });
    }

    async loadFriends() {
        try {
            this.friends = await getFriends();
            this.render();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    setupWebSocketListeners() {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.update_online_status(data);
            };
        }
    }

    update_online_status(data) {
        this.friends.forEach(friend => {
            const statusElement = this.shadowRoot.querySelector(`.status[data-id="${friend.id}"]`);
            if (statusElement) {
                if (data.is_online === true && friend.username == data.username) {
                    statusElement.classList.add('online');
                    statusElement.classList.remove('offline');
                } else if (data.is_online === false && friend.username == data.username) {
                    statusElement.classList.add('offline');
                    statusElement.classList.remove('online');
                }
            }
        });
    }

    render() {
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/friends_list.css');

        const bootstrapLink = document.createElement('link');
        bootstrapLink.setAttribute('rel', 'stylesheet');
        bootstrapLink.setAttribute('href', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css');

        this.shadowRoot.innerHTML = `
            <div class="friends-container">
                <h2>Friends</h2>
                <ul>
                    ${this.friends.map(friend => {
            let profilePictureUrl = friend.profile_picture.replace('http://localhost/', '');
            if (profilePictureUrl.includes('intra.42.fr')) {
                profilePictureUrl = profilePictureUrl.replace('media/https%3A/', 'https://');
            }
            const regex = /http:\/\/made-[^\/]+\/?/;
            if (profilePictureUrl.match(regex))
                profilePictureUrl = profilePictureUrl.replace(regex, '');
            return `
                <li class="friend-card">
                    <img src="${profilePictureUrl}" alt="Profile Picture"></img>
                    ${friend.username} 
                    <span data-id="${friend.id}" class="status ${friend.online_devices_count != 0 ? 'online' : 'offline'}"></span>
                    <button data-id="${friend.id}" class="remove-friend">Remove</button>
                </li>`
                        }).join('')}
                </ul>
                <input type="text" id="new-friend-username" placeholder="Add a friend by username">
                <div style="height: 1rem;"></div>
                <button id="add-friend-button" class="btn btn-success" >Add Friend</button>
            </div>
        `;
        this.addEventListeners();
        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(bootstrapLink);
    }

   addEventListeners() {
    const inputField = this.shadowRoot.querySelector('#new-friend-username');
    const addButton = this.shadowRoot.querySelector('#add-friend-button');
    
    addButton.addEventListener('click', () => this.addFriend());
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            this.addFriend();
        }
    });

    this.shadowRoot.querySelectorAll('.remove-friend').forEach(button => {
        button.addEventListener('click', event => this.removeFriend(event.target.dataset.id));
    });
}
 
    async addFriend() {
        const sanitized_username = this.shadowRoot.querySelector('#new-friend-username').value.replace(/[^a-zA-Z0-9_]/g, '');
        if (!sanitized_username) {
            showToast('Usernames can only contain letters, numbers or undercores and can\'t be empty', 'error', 3000);
            return;
        }
        const user = await getUserByUsername(sanitized_username);
        if (user) {
            await this.sendFriendRequest(sanitized_username);
        } else {
            console.log('User search failed');
        }
    }

    async removeFriend(userId) {
        await removeFriend(userId);
        await this.loadFriends();
    }

    async sendFriendRequest(recipientUsername) {
        fetch('accounts/send-friend-request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                username: recipientUsername,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.detail === 'Friend request sent successfully.') {
                    console.log(data.detail);
                    showToast(data.detail);
                } else {
                    console.error(data.detail);
                    showToast(data.detail, 'error');
                }
            })
            .catch(error => console.error('Error:', error));
    }

}

customElements.define('friends-view', FriendsComponent);
