import { navigateTo, handleFormSubmit } from '../navigation.js';
import { showToast, getCookie, initializeWebSocket } from '../utils.js';
import { getUserInfo } from '../scripts.js';

export class ResetPasswordForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('accounts/render-password-reset-form/', { method: 'GET' });
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
                this.formElement = this.shadowRoot.getElementById('password-reset-form');
            }
            handleFormSubmit('reset_password');
            this.shadowRoot.getElementById('subBtn').addEventListener("click", () => {
                const fields = this.formElement.querySelectorAll('input[required]');
                let hasEmptyFields = false;

                for (const field of fields) {
                    if (!field.value) {
                        hasEmptyFields = true;
                        showToast(`${field.name} is required`);
                        break;
                    }
                }
            });
            this.shadowRoot.querySelector("#signinButton").addEventListener("click",
            (event) => {
                event.preventDefault();
                navigateTo('signin', 2);
            });
        }
        catch (error) {
            console.log(`Error changing password: ${error}`);
            showToast(`Error changing password: ${error}`, 'error');
            if (error.response && error.response.status === 500)
                console.error("Server error encountered. Cannot redirect.");
        }
    }

    getFormElement() {
        return this.formElement;
    }
}

customElements.define('reset-password-form', ResetPasswordForm);