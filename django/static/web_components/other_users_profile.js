import { getUserInfo, user } from '../scripts.js'
import { navigateTo } from '../views.js'
import { UserObserver } from '../observer.js';
import { getUserFromStorage, getCookie, showToast } from '../utils.js';

export class OtherUserProfileCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.user = null;
        this.pfpUrl = null;
    }

    async connectedCallback() {
        const template = document.createElement('template')
        await fetch(`accounts/users/${this.getAttribute('user-id')}/profile/`)
            .then(response => response.json())
            .then(data => {
                this.user = data;
            })
        this.pfpUrl = this.user.profile_picture;
        if (this.pfpUrl.includes('intra.42.fr'))
            this.pfpUrl = this.pfpUrl.replace('/media/https%3A/', 'https://');
        const regex = /http:\/\/made-[^\/]+\/?/;
        if (this.pfpUrl.match(regex))
            this.pfpUrl = this.pfpUrl.replace(regex, '');
        template.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <div class="user-info-card" id="user-info-card">
            <img id="pfp" src='${this.pfpUrl}'>
            <h1 id="username">${this.user.username}</h1>
            <div  class='container text-center'>
                <div class="stats">
                    Pong stats :
                    ${this.user.wins} win(s) |   
                    ${this.user.losses} loss(es)
                </div>
            </div>
            <div class='container text-center' style="margin-top:1rem;">
                <div>
                    Game History:
                </div>
            </div>
            <div class="row">
                <div class="col-sm text-center">
                    <img src="media/pong_icon.png" title="Pong matches" class="icon view-matches-link" id="view-pong-matches">
                </div>
                <div class="col-sm text-center">
                    <img src="media/tictactoe_icon.png" title="Tic Tac Toe matches" class="icon view-matches-link" id="view-morpion-matches">
                </div>
            </div>
            <button class="btn btn-danger" id="blockUserButton">Block User</button>
            <button class="btn btn-secondary" id="unblockUserButton">Unblock User</button>
        </div>
        <div class="match-history-cards"></div>
        <div class="match-history-veil"></div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/user_profile.css');
        this.shadowRoot.appendChild(styleLink);
        this.userId = this.getAttribute('user-id');
        this.addEventListeners();
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
    const username = this.shadowRoot.querySelector('#username').textContent.trim();
    try {
        console.log(this.user.id, 'ID !!!!')
        const response = await fetch(`/accounts/users/${this.user.id}/block-user/`, {
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
    const username = this.shadowRoot.querySelector('#username').textContent.trim();
    try {
        const response = await fetch(`/accounts/users/${this.user.id}/unblock-user/`, {
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
