import { getFriends, addFriend, removeFriend, getUserByUsername } from "../user_utils.js";

export class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.friends = [];
    }

    connectedCallback() {
        this.loadFriends();
        this.render();
    }

    async loadFriends() {
        this.friends = await getFriends();
        this.render();
    }

    render() {
        this.innerHTML = `
            <div>
                <h2>Friends</h2>
                <ul>
                    ${this.friends.map(friend => `<li>${friend.username} <button data-id="${friend.id}" class="remove-friend">Remove</button></li>`).join('')}
                </ul>
                <input type="text" id="new-friend-username" placeholder="Add a friend by username">
                <button id="add-friend-button">Add Friend</button>
            </div>
        `;
        this.addEventListeners();
    }

    addEventListeners() {
        this.querySelector('#add-friend-button').addEventListener('click', () => this.addFriend());
        this.querySelectorAll('.remove-friend').forEach(button => {
            button.addEventListener('click', event => this.removeFriend(event.target.dataset.id));
        });
    }

    async addFriend() {
        const username = this.querySelector('#new-friend-username').value;
        const user = await getUserByUsername(username); // Function to get user by username
        if (user) {
            await addFriend(user.id);
            this.loadFriends();
        }
        else{
            console.log('User search failed');
        }
    }

    async removeFriend(userId) {
        await removeFriend(userId);
        this.loadFriends();
    }
}

customElements.define('friends-view', FriendsComponent);