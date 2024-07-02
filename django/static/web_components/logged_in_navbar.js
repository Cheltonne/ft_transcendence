import { navigateTo } from '../views.js';
import { handleLogout } from '../utils.js';
import { getUserInfo, user } from '../scripts.js';
import { User, UserObserver } from '../observer.js';
import { showToast } from '../utils.js';

export class LoggedInNavbar extends HTMLElement {
    constructor() {
        super();
        const navbar = document.createElement('template')
        navbar.innerHTML = `
        <div id ="navbar" class="off-screen-menu">
          <ul class="nav-list">
            <li><div id="profilePictureContainer" class='profile-picture'></div></li>
            <li><div id="loginHeading" class="fs-5 fw-semibold username" style="color:white;"></div></li>
            <li><a href="#" class="homeButton">Home</a></li>
            <li class='profile-button-li'><a href="#" class="profileButton">My Profile</a></li>
            <li><a class="morpionButton">Morpion</a></li>
            <li><a class="button logoutButton" id="logoutButton" href="#">Logout</a></li>
          </ul>
        </div>
        `;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(navbar.content.cloneNode(true));
    }

    connectedCallback() {
        this.home = this.shadowRoot.querySelector('.homeButton');
        this.profile = this.shadowRoot.querySelector('.profileButton');
        this.morpion = this.shadowRoot.querySelector('.morpionButton')
;        this.logout = this.shadowRoot.querySelector('.logoutButton');
        let user_observer;
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/sidebar.css'); 
        this.shadowRoot.appendChild(styleLink);
        const elements = {
            username: this.shadowRoot.querySelectorAll(".username"),
            profile_picture: this.shadowRoot.querySelectorAll(".profile-picture"),
        };
        user_observer = new UserObserver(elements);
        user.addObserver(user_observer);
        this.home.addEventListener("click", () => {
            navigateTo('pong', 1);
        });

        this.profile.addEventListener('click', (event) => {
            event.preventDefault();
            getUserInfo()
                .then(userInfo => {
                    if (userInfo.username) {
                        navigateTo('user-profile', 1);
                    }
                    else
                    {
                        showToast('Please login first.', 'error');
                        navigateTo('pong', 1);
                    }
                })
        })

        this.morpion.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('morpion', 1);
            console.log('morpion');
        });

        this.logout.addEventListener('click', (event) => {
            handleLogout();
            event.stopImmediatePropagation()
        });
    }

    disconnectedCallback() {
    }
}

customElements.define('logged-in-navbar', LoggedInNavbar);