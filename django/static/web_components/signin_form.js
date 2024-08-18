import { navigateTo, showForm, handleFormSubmit } from '../views.js';
import { showToast } from '../utils.js';
import { getUserInfo } from '../scripts.js';
import { ChooseUsernameForm } from './choose_username_form.js';
import { initializeWebSocket } from '../utils.js';

export class SigninForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('accounts/render-signin-form/', { method: 'GET' });
            if (!response.ok)
                console.log(`Error logging in: ${response.status}`);
            else {
                const data = await response.json();
                const token = data.token;
                const styleLink = document.createElement('link');

                styleLink.setAttribute('rel', 'stylesheet');
                styleLink.setAttribute('href', 'static/css/pong_theme.css');
                this.shadowRoot.innerHTML = data.form;
                this.shadowRoot.appendChild(styleLink);
                this.formElement = this.shadowRoot.getElementById('signin-form');
                const oauthButton = document.createElement('button');
                oauthButton.id = 'oauth-login-button';
                oauthButton.type = 'submit'
                oauthButton.innerText = 'Login with 42Auth';
                this.formElement.appendChild(oauthButton);

                oauthButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.loginWithOAuth();
                });
            }
            handleFormSubmit('signin');
            this.shadowRoot.querySelector("#signupButton").addEventListener("click", (event) => {
                event.preventDefault();
                navigateTo('signup', 2);
            });
        }
        catch (error) {
            console.log(`Error logging in: ${error}`);
            showToast(`Error logging in: ${error}`, 'error');
            if (error.response && error.response.status === 500)
                console.error("Server error encountered. Cannot redirect.");
        }
    }

async loginWithOAuth() {
    try {
        const response = await fetch('/oauth/url/');
        const data = await response.json();
        const authWindow = window.open(data.auth_url, '_blank', 'width=500,height=720');

        // Polling to check localStorage for messages from the auth window
        const pollTimer = window.setInterval(() => {
            const message = localStorage.getItem('oauth_message');
            if (message) {
                window.clearInterval(pollTimer);
                localStorage.removeItem('oauth_message'); // Clean up after reading the message to avoid utter destruction
                this.handleOAuthMessage(JSON.parse(message));
            }
            if (authWindow.closed) {
                window.clearInterval(pollTimer);
            }
        }, 1000);

    } catch (error) {
        console.log('Error during OAuth login:', error);
        showToast(`Error during OAuth login: ${error}`, 'error');
    }
}

    handleOAuthMessage(message) {
        if (message.type === 'username_taken') {
            console.log('Username is taken. Please choose another one.');
            navigateTo('choose-username', 2, message.oauth_id);
            window.userInfo = {
                oauth_id: message.oauth_id,
                email: message.email,
                profile_picture: message.profile_picture
            };
        } else if (message.type === 'oauth_success')
            this.handleLoginSucc();
    }

    handleLoginSucc() {
        showToast(`Login success!`);
        getUserInfo();
        navigateTo('pong', 1);
        initializeWebSocket();
        const customEvent = new CustomEvent('user-login');
        window.dispatchEvent(customEvent);
    }

    getFormElement() {
        return this.formElement;
    }
}

customElements.define('signin-form', SigninForm);