import { showView, showForm, handleFormSubmit } from '../views.js';
import { showToast } from '../utils.js';

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
            }
                handleFormSubmit('signin');
            this.shadowRoot.querySelector("#signupButton").addEventListener("click", (event) => {
                event.preventDefault();
                showForm('signup');
            });
        }
        catch (error) {
            console.log(`Error logging in: ${error}`);
            showToast(`Error logging in: ${error}`, 'error');
            if (error.response && error.response.status === 500) {
                console.error("Server error encountered. Cannot redirect.");
            }
            //showView('game');
	    }
    }

    getFormElement() {
        return this.formElement;
    }
}

customElements.define('signin-form', SigninForm);