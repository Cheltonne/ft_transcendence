import { navigateTo, showForm, handleFormSubmit } from '../views.js';
import { showToast } from '../utils.js';

export class SignupForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('accounts/render-signup-form/', { method: 'GET' });
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
                this.formElement = this.shadowRoot.getElementById('signup-form');
            }
            handleFormSubmit('signup');
            this.shadowRoot.querySelector("#signinButton").addEventListener("click", (event) => {
                event.preventDefault();
                navigateTo('signin', 2);
            });
        }
        catch (error) {
            console.log(`Error logging in: ${error}`);
            showToast(`Error logging in: ${error}`, 'error');
            if (error.response && error.response.status === 500) {
                console.error("Server error encountered. Cannot redirect.");
            }
            navigateTo('pong', 1);
	    }
    }

    getFormElement() {
        return this.formElement;
    }
}

customElements.define('signup-form', SignupForm);