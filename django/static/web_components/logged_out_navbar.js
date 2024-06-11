import { getUserInfo } from '../scripts.js'
import { navigateTo } from '../views.js'

export class LoggedOutNavbar extends HTMLElement {
  constructor() {
    super();
    const navbar = document.createElement('template')
    navbar.innerHTML = `
        <div id ="navbar" class="off-screen-menu">
	        <ul class="nav-list">
		        <li><div class="fs-5 fw-semibold" style="color:white;">Hey anon!</div></li>
		        <li><a href="#" class="homeButton">Home</a></li>
		        <li><a class="button loginButton" id="loginButton" href="#">Login</a></li>
	        </ul>
        </div>
        `;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(navbar.content.cloneNode(true));
  }

  connectedCallback() {
    this.home = this.shadowRoot.querySelector('.homeButton');
    this.login = this.shadowRoot.querySelector('.loginButton');
    const styleLink = document.createElement('link');

    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', 'static/css/sidebar.css'); 
    this.shadowRoot.appendChild(styleLink);
    this.home.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo('pong', 1);
      event.stopImmediatePropagation();
    });

    this.login.addEventListener('click', (event) => {
      event.preventDefault();
      navigateTo('signin', 2);
      event.stopImmediatePropagation();
    });
  }

  disconnectedCallback() {
  }

}

customElements.define('logged-out-navbar', LoggedOutNavbar);