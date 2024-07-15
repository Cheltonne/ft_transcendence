import { getUserInfo, user } from '../scripts.js'
import { navigateTo } from '../views.js'
import { UserObserver } from '../observer.js';
import { getUserFromStorage } from '../utils.js';

export class UserProfileCard extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template')
        template.innerHTML = `
        <div class="user-info-card" id="user-info-card">
            <div class='profile-picture'></div>
            <div class="username"></div>
            <div class="wins"></div>
            <div class="losses"></div>
            <div class="match-history-link view-matches-link">
                See Match History
            </div>
            <a class="button updateButton">Update Profile</a>
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
                this.shadowRoot.querySelector('.match-history-cards').classList.toggle('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.toggle('active');
            }
        })
		user.setUserData(getUserFromStorage());
    }

    renderUserProfile(userInfo) {
        console.log("renderUserProfile() called.");
        if (userInfo.user_matches) {
            const matchHistoryCards = this.shadowRoot.querySelector('.match-history-cards');
            matchHistoryCards.innerHTML = '';

            let i = 0;
            userInfo.user_matches.forEach(match => {
                const matchCard = this.shadowRoot.ownerDocument.createElement('div');
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
                    <h1>Match ${++i}</h1>
                    <b> Opponent </b>
                    <p>CPU</p>
                    <b> Winner </b>
                    <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
                    <b> Score </b>
                    <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
                `;
                matchHistoryCards.appendChild(matchCard);
            });
        }
    }

    disconnectedCallback() { }

}

customElements.define('user-profile-view', UserProfileCard);