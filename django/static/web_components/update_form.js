import { navigateTo, showForm, handleFormSubmit } from '../navigation.js';
import { showToast } from '../utils.js';

export class UpdateForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('accounts/render-update-form/', { method: 'GET' });
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
                this.formElement = this.shadowRoot.getElementById('update-form');
            }
            handleFormSubmit('update');
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

customElements.define('update-form', UpdateForm);