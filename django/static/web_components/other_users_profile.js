import { getUserInfo, user } from '../scripts.js'
import { navigateTo } from '../views.js'
import { UserObserver } from '../observer.js';
import { getUserFromStorage, getCookie, showToast } from '../utils.js';

export class OtherUserProfileCard extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template')
        template.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <div class="user-info-card" id="user-info-card">
            <div class='profile-picture'></div>
            <div class="username"></div>
            <div class="wins"></div>
            <div class="losses"></div>
            <button class="btn btn-light view-matches-link" id="view-pong-matches">
                See Pong Match History
            </button>
            <button class="btn btn-light view-matches-link" id="view-morpion-matches">
                See Morpion Match History
            </button>
            <button class="btn btn-danger" id="blockUserButton">Block User</button>
            <button class="btn btn-secondary" id="unblockUserButton">Unblock User</button>
        </div>
        <div class="match-history-cards"></div>
        <div class="match-history-veil"></div>
        `;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.userId = null;
        this.user = null;
        this.username = this.shadowRoot.querySelector(".username");
        this.pfp = this.shadowRoot.querySelector(".profile-picture");
    }

    connectedCallback() {
        this.userId = this.getAttribute('user-id');
        this.loadUserProfile();
        this.addEventListeners();
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/user_profile.css');
        this.shadowRoot.appendChild(styleLink);
    }

    addEventListeners() {
        this.shadowRoot.querySelector('#blockUserButton').addEventListener('click', () => this.blockUser());
        this.shadowRoot.querySelector('#unblockUserButton').addEventListener('click', () => this.unblockUser());
        this.shadowRoot.addEventListener('click', (event) => {
            if (!event.target.closest('.match-history-card') && 
            this.shadowRoot.querySelector('.match-history-cards').classList.contains('active')) {
                this.shadowRoot.querySelector('.match-history-cards').classList.remove('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.remove('active');
            } else if (event.target.classList.contains('view-matches-link')) {
                user.setUserData(getUserFromStorage());
                const matchType = event.target.id === 'view-pong-matches' ? 'pong' : 'morpion';
                this.renderUserProfile(this.user, matchType);
                this.shadowRoot.querySelector('.match-history-cards').classList.toggle('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.toggle('active');
            }
        });
    }

   async loadUserProfile() {
        try {
            const response = await fetch(`/accounts/users/${this.userId}/user-info/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data;
                this.username.innerHTML = `<h1>${data.username}</h1>`;
                this.pfp.innerHTML = `<img src="${data.profile_picture.replace('http://localhost/', '')}"></img>`;
            } else 
                showToast('Failed to load user profile', 'error');
        } catch (error) {
            console.error('Error loading user profile:', error);
            showToast('Error loading user profile', 'error');
        }
    } 

    renderUserProfile(userInfo, matchType = 'pong') {
        console.log("renderUserProfile() called.");
        const matchHistoryCards = this.shadowRoot.querySelector('.match-history-cards');
        matchHistoryCards.innerHTML = '';

        if (matchType === 'pong' && userInfo.user_matches) {
            let i = 0;
            userInfo.user_matches.forEach(match => {
                console.log(match)
                const matchDate = match.timestamp ? new Date(match.timestamp) : null;
                const formattedDate = matchDate ? matchDate.toLocaleString() : 'Date not available';
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Pong Match ${++i}</h1>
                    <b>Opponent</b>
                    <p>CPU</p>
                    <b>Winner</b>
                    <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
                    <b>Score</b>
                    <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
                    <b>Played at</b>
                    <p>${formattedDate}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
        } else if (matchType === 'morpion' && userInfo.morpion_matches) {
            let i = 0;
            userInfo.morpion_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                const matchDate = match.timestamp ? new Date(match.timestamp) : null;
                const formattedDate = matchDate ? matchDate.toLocaleString() : 'Date not available';
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Morpion Match ${++i}</h1>
                    <b>Player 1</b>
                    <p>${match.player1__username}</p>
                    <b>Player 2</b>
                    <p>${match.player2__username}</p>
                    <b>Winner</b>
                    <p>${match.winner__username}</p>
                    <b>Score</b>
                    <p>${match.player1__username}: ${match.player1_score} - ${match.player2__username}: ${match.player2_score}</p>
                    <b>Played at</b>
                    <p>${formattedDate}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
            let y = 0;
            userInfo.morpion_ai_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                const matchDate = match.timestamp ? new Date(match.timestamp) : null;
                const formattedDate = matchDate ? matchDate.toLocaleString() : 'Date not available';
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Morpion Ai Match ${++y}</h1>
                    <b>Player</b>
                    <p>${match.player1__username}</p>
                    <b>AI</b>
                    <p>CPU</p>
                    <b>Winner</b>
                    <p>${match.winner__username ? match.winner__username : 'AI'}</p>
                    <b>Score</b>
                    <p>${match.player1__username}: ${match.player1_score} - CPU: ${match.ai_score}</p>
                    <b>Played at</b>
                    <p>${formattedDate}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
        }
    }

    async blockUser() {
        const username = this.shadowRoot.querySelector('.username').textContent.trim();
        try {
            const response = await fetch(`/accounts/users/${this.userId}/block-user/`, {
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

    async unblockUser() {
        const username = this.shadowRoot.querySelector('.username').textContent.trim();
        try {
            const response = await fetch(`/accounts/users/${this.userId}/unblock-user/`, {
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

    disconnectedCallback() {
    }
}

customElements.define('other-user-profile-view', OtherUserProfileCard);
