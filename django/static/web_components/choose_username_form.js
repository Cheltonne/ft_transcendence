import { navigateTo } from "../views.js";
import { getCookie, showToast, initializeWebSocket } from "../utils.js";
import { getUserInfo } from "../scripts.js";

export class ChooseUsernameForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        const { oauth_id, email, profile_picture } = window.userInfo;

        this.shadowRoot.innerHTML = `
            <form id="choose-username-form">
                <h1>Choose a Username</h1>
                <input type="text" id="username" placeholder="Enter a new username" required>
                <button type="submit">Submit</button>
            </form>
        `;
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/pong_theme.css');
        this.shadowRoot.appendChild(styleLink);
        const custom_style = document.createElement('template');
        custom_style.innerHTML = `
        <style>
            #username {
                width: 25%;
            }
        </style>
        `
        this.shadowRoot.appendChild(custom_style.content.cloneNode(true));
        const formElement = this.shadowRoot.querySelector('#choose-username-form');
        formElement.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newUsername = this.shadowRoot.querySelector('#username').value;

            const response = await fetch('/oauth/choose-username/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    username: newUsername,
                    oauth_id: oauth_id,
                    email: email,
                    profile_picture: profile_picture
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                showToast('Succesfully created an account! Logging you in.');
                navigateTo('pong', 1);
                getUserInfo();
                initializeWebSocket();
                const customEvent = new CustomEvent('user-login');
                window.dispatchEvent(customEvent);
            } else {
                if (result.error === 'Username already taken')
                    showToast('Username already taken, please choose another one.', 'error');
                else
                    showToast(result.error, 'error');
            }
        });
    }
}

customElements.define('choose-username-form', ChooseUsernameForm);
