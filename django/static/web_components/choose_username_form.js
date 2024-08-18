import { navigateTo } from "../views.js";

navigateTo

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

        const formElement = this.shadowRoot.querySelector('#choose-username-form');
        formElement.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newUsername = this.shadowRoot.querySelector('#username').value;

            const response = await fetch('/oauth/choose-username/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                showToast('Username set successfully. Logging you in...');
                navigateTo('pong');
            } else {
                showToast(result.error, 'error');
            }
        });
    }
}

customElements.define('choose-username-form', ChooseUsernameForm);
