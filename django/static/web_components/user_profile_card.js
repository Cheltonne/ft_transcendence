import { getUserInfo, user } from '../scripts.js'
import { showSignin, showUpdate } from '../views.js'
import { User, UserObserver } from '../observer.js';

export class UserProfileCard extends HTMLElement {
    constructor() {
        super();
        const navbar = document.createElement('template')
        navbar.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <style>
            a {
              font-family: monospace;
              color:brown;
              text-decoration: none;
            }

            a:visited {
              color: brown;
            }

            a:hover {
              color: #6F86FF;
              text-decoration: none;
            }

            .button {
              background-color: #dddace;
              color: brown;
              padding: 5px 10px;
              border-radius: 3px;
              cursor: pointer;
              font-weight: bold;
            }

            button:hover {
              background-color: #2980b9;
            }

            .user-info-card {
                display: flex;
                flex-direction: column;
                width: 450px;
                height: 600px;
                margin: 50px auto;
                background-color: rgba(228, 255, 246, 0.877);
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                position: relative;
                /* Enable positioning for overlay */
            }

            .user-info-card img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
            }

            .user-info-card .username {
                bottom: 0;
                position: relative;
                width: 100%;
                color: rgba(247, 255, 252, 0.945);
                background-color: rgba(47, 65, 59, 0.253);
                font-weight:lighter;
                border-radius: 3px;
                font-size: 3rem;
                text-align: left;
            }

            .match-history-link {
            color: #5b75a3;
            text-align: center;
            font-size: 1.2em;
            margin-top: auto;
            padding: 15px;
            cursor: pointer;
            user-select: none;
            background-color: rgba(247, 255, 252, 0.945);
            }

            .match-history-link:hover {
            background-color: rgb(255, 255, 255);
            }

            .match-history-cards {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
            margin: 0 auto;
            top: 25rem;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            position: absolute;
            z-index: -1;
            }

            .match-history-cards.active {
            opacity: 1;
            z-index: 43;
            }

            .match-history-card {
            margin: 25px;
            padding: 10px;
            border-radius: 5px;
            background-color: rgb(240, 240, 240);
            color: #12151a;
            display:flex;
            flex-direction: column;
            }

            .match-history-card b{
            justify-content: center;
            }

            .match-history-veil {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            z-index: -1;
            }

            .match-history-veil.active {
            opacity: 1;
            z-index: 42;
            background-color: #12151a62;
            }
        </style>

        <div class="user-info-card" id="user-info-card">
            <div class='profile-picture'></div>
            <div id="user-card-username" class="username"></div>
            <div class="match-history-link view-matches-link">
                <a id="show-matches">See Match History</a>
            </div>
            <a class="button updateButton">Update Profile</a>
        </div>
        <div class="match-history-cards"></div>
        <div class="match-history-veil"></div>
        `;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(navbar.content.cloneNode(true));
    }

    connectedCallback() {
        let user_observer;

        const elements = {
            username: this.shadowRoot.querySelectorAll(".username"),
            profile_picture: this.shadowRoot.querySelectorAll(".profile-picture"),
            match_history_cards: this.shadowRoot.querySelector(".match-history-cards"),
        };
        user_observer = new UserObserver(elements);
        user.addObserver(user_observer);
        this.shadowRoot.querySelector('.updateButton').addEventListener('click', (event) => {
            showUpdate();
        });
        console.log('User information retrieved:', elements);

        this.shadowRoot.addEventListener('click', (event) => {
            if (!event.target.closest('.match-history-card') && this.shadowRoot.querySelector('.match-history-cards').classList.contains('active')) {
                this.shadowRoot.querySelector('.match-history-cards').classList.remove('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.remove('active');
                const matchHistoryCards = this.shadowRoot.querySelector('.match-history-cards');
                matchHistoryCards.innerHTML = '';
            } else if (event.target.classList.contains('view-matches-link')) {
                this.shadowRoot.querySelector('.match-history-cards').classList.toggle('active');
                this.shadowRoot.querySelector('.match-history-veil').classList.toggle('active');
            }
        })
    }

    renderUserProfile() {
        console.log("renderUserProfile() called.");
        if (userInfo.user_matches) {
            const matchHistoryCards = document.querySelector('.match-history-cards');
            matchHistoryCards.innerHTML = '';

            let i = 0;
            userInfo.user_matches.forEach(match => {
                const matchCard = document.createElement('div');
                matchCard.classList.add('match-history-card');
                matchCard.innerHTML = `
			<h1>Match ${++i}</h1>
			<b> Opponent </b> <p>CPU</p>
			<b> Winner </b> <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
			<b> Score </b> <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
		`;
                matchHistoryCards.appendChild(matchCard);
            });
        }
    }

    disconnectedCallback() {
    }

}

customElements.define('user-profile-card', UserProfileCard);