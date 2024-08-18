import { navigateTo, showForm, handleFormSubmit } from '../views.js';
import { showToast } from '../utils.js';
import { getUserInfo } from '../scripts.js';
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
            if (!response.ok) {
                console.log(`Error logging in: ${response.status}`);
            }
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
                oauthButton.innerText = 'Login with OAuth';
                this.shadowRoot.appendChild(oauthButton);

                // Handle OAuth login
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
            if (error.response && error.response.status === 500) {
                console.error("Server error encountered. Cannot redirect.");
            }
        }
    }

    async loginWithOAuth() {
        try {
            const response = await fetch('/oauth/url/');
            const data = await response.json();
            const authWindow = window.open(data.auth_url, '_blank', 'width=500,height=720');

            const pollTimer = window.setInterval(() => {
                if (authWindow.closed) {
                    window.clearInterval(pollTimer);
                    this.checkAuthStatus();
                }
            }, 1000);

        } catch (error) {
            console.log('Error during OAuth login:', error);
            showToast(`Error during OAuth login: ${error}`, 'error');
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/oauth/status/');
            const data = await response.json();
            if (data.is_authenticated) {
                showToast(`Login success!`);
                getUserInfo();
                navigateTo('pong', 1);
                initializeWebSocket();
                const customEvent = new CustomEvent('user-login');
                window.dispatchEvent(customEvent);
            } else if (data.error === 'username_taken') {
                // Handle the case where the username is taken
                console.log('Username is taken. Please choose another one.');
                navigateTo('choose-username', 2, data.oauth_id);
                window.userInfo = {
                    oauth_id: data.oauth_id,
                    email: data.email,
                    profile_picture: data.profile_picture
                };
            }
            else {
                showToast('OAuth login failed.', 'error');
            }
        } catch (error) {
            console.log('Error checking OAuth status:', error);
            showToast(`Error checking OAuth status: ${error}`, 'error');
        }
    }

    getFormElement() {
        return this.formElement;
    }
}

customElements.define('signin-form', SigninForm);