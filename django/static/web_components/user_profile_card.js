import { getUserInfo, user } from '../scripts.js'
import { navigateTo } from '../views.js'
import { UserObserver } from '../observer.js';
import { getUserFromStorage } from '../utils.js';

export class UserProfileCard extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template')
        template.innerHTML = `
        <!-- <div class="user-info-card" id="user-info-card">
            <div class='profile-picture'></div>
            <div class="username"></div>
            <div class="wins"></div>
            <div class="losses"></div>
            <div class="match-history-link view-matches-link" id="view-pong-matches">
                See Pong Match History
            </div>
            <div class="match-history-link view-matches-link" id="view-morpion-matches">
                See Morpion Match History
            </div>
            <a class="button updateButton">Update Profile</a>
        </div>
        <div class="match-history-cards"></div>
        <div class="match-history-veil"></div>-->
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
            <a class="btn btn-secondary updateButton">Update Profile</a>
        </div>
        <div class="match-history-cards"></div>
        <div class="match-history-veil"></div>
        `;
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        let user_observer;
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/user_profile.css');
        this.shadowRoot.appendChild(styleLink);
        const elements = {
            username: this.shadowRoot.querySelectorAll(".username"),
            profile_picture: this.shadowRoot.querySelectorAll(".profile-picture"),
            match_history_cards: this.shadowRoot.querySelector(".match-history-cards"),
            wins: this.shadowRoot.querySelectorAll(".wins"),
            losses: this.shadowRoot.querySelectorAll(".losses"),
        };
        user_observer = new UserObserver(elements);
        user.addObserver(user_observer);
        this.shadowRoot.querySelector('.updateButton').addEventListener('click', (event) => {
            navigateTo('update', 2);
        });
        this.shadowRoot.addEventListener('click', (event) => {
            if (!event.target.closest('.match-history-card') && this.shadowRoot.querySelector('.match-history-cards').classList.contains('active')) {
                this.shadowRoot.querySelector('.match-history-cards').classList.remove('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.remove('active');
            } else if (event.target.classList.contains('view-matches-link')) {
                user.setUserData(getUserFromStorage());
                const matchType = event.target.id === 'view-pong-matches' ? 'pong' : 'morpion';
                this.renderUserProfile(user.getUserData(), matchType);
                this.shadowRoot.querySelector('.match-history-cards').classList.toggle('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.toggle('active');
            }
        });
        user.setUserData(getUserFromStorage());
    }


    renderUserProfile(userInfo, matchType = 'pong') {
        console.log("renderUserProfile() called.");
        const matchHistoryCards = this.shadowRoot.querySelector('.match-history-cards');
        matchHistoryCards.innerHTML = '';

        if (matchType === 'pong' && userInfo.user_matches) {
            let i = 0;
            userInfo.user_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Match ${++i}</h1>
                    <b>Opponent</b>
                    <p>CPU</p>
                    <b>Winner</b>
                    <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
                    <b>Score</b>
                    <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
        } else if (matchType === 'morpion' && userInfo.morpion_matches) {
            let i = 0;
            userInfo.morpion_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
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
                `;
                matchHistoryCards.appendChild(matchCard);
            });
            let y = 0;
            userInfo.morpion_ai_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Morpion Ai Match ${++y}</h1>
                    <b>Player</b>
                    <p>${match.player1__username}</p>
                    <b>Player</b>
                    <p>AI</p>
                    <b>Winner</b>
                    <p>${match.winner__username ? match.winner__username : 'AI'}</p>
                    <b>Score</b>
                    <p>${match.player1__username}: ${match.player1_score} - AI: ${match.ai_score}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
        }
    }

    disconnectedCallback() { }

}

customElements.define('user-profile-view', UserProfileCard);