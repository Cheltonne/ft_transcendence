import { getUserInfo, user } from '../scripts.js'
import { navigateTo } from '../navigation.js'
import { UserObserver } from '../observer.js';
import { getUserFromStorage } from '../utils.js';

export class UserProfileCard extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template')
        this.currentUser =  getUserFromStorage();
        let profilePictureUrl = this.currentUser.profile_picture;
        if (profilePictureUrl.includes('intra.42.fr'))
            profilePictureUrl = profilePictureUrl.replace('media/https%3A/', 'https://');
        const regex = /http:\/\/made-[^\/]+\/?/;
        if (profilePictureUrl.match(regex))
            profilePictureUrl = profilePictureUrl.replace(regex, '');
        const pfp = profilePictureUrl.replace('http://localhost/', '');
        template.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet">
        <div class="user-info-card" id="user-info-card">
            <img id="pfp" src='${pfp}'>
            <h1 id="username">${this.currentUser.username}</h1>
            <div  class='container text-center'>
                <div class="stats">
                    Pong stats :
                    ${this.currentUser.wins} win(s) |   
                    ${this.currentUser.losses} loss(es)
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
            <a class="btn updateButton">Update Profile</a>
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
        this.shadowRoot.querySelector('.updateButton').addEventListener('click', () => {
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

    // match.player1__username PLAYER_2
    // userInfo.username PAGE ACTUELLE
    // match.alias_username PLAYER 1
    //${match.player1__username === userInfo.username ? match.alias_username : 'guest'}</p>
    renderUserProfile(userInfo, matchType = 'pong') {
        console.log("renderUserProfile() called.");
        const matchHistoryCards = this.shadowRoot.querySelector('.match-history-cards');
        matchHistoryCards.innerHTML = '';

        if (matchType === 'pong' && userInfo.user_matches) {
            let i = 0;
            userInfo.user_matches.forEach(match => {
                const online_match = match.player2__username ? true : false;
                const matchDate = match.timestamp ? new Date(match.timestamp) : null;
                const formattedDate = matchDate ? matchDate.toLocaleString() : 'Date not available';
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                const player1 = match.player1__username;
                const player2 = online_match ? match.player2__username : "CPU";
                const player1score = match.player1_score;
                const player2score = match.player2_score;
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Pong Match ${++i}</h1>
                    <b>Player 1</b>
                    <p>${player1}</p>
                    <b>Player 2</b>
                    <p>${player2}</p>
                    <b>Winner</b>
                    <p>${online_match ? match.winner__username : "CPU"}</p>
                    <b>Score</b>
                    <p>${player1}: ${player1score} - ${player2}: ${player2score}</p>
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

    disconnectedCallback() { }

}

customElements.define('user-profile-view', UserProfileCard);