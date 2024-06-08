import { getUserInfo } from '../scripts.js'
import { showSignin } from '../views.js'

export class LoggedOutNavbar extends HTMLElement {
  constructor() {
    super();
    const navbar = document.createElement('template')
    navbar.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <style>
            a {
              font-family: monospace;
              color:brown;
              text-decoration: none;
            }

            a:visited {
              color: brown;
            }

            a:hover {
              color: #6F86FF;
              text-decoration: none;
            }

            ul {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              list-style-type: none;
            }

            nav {
              padding: 1rem;
              display: flex;
              background-color: #12151a;
            }

            .button {
              background-color: #dddace;
              color: brown;
              padding: 5px 10px;
              border-radius: 3px;
              cursor: pointer;
              font-weight: bold;
            }

            .profile-picture {
              vertical-align: middle;
              width: 12rem;
              height: 12rem;
              border-radius: 50%;
              object-fit: cover;
            }

            .toast-container {
              position: fixed;
              top: 1.5rem;
              right: 4rem;
              display: flex;
              flex-direction: column;
              z-index: 9999;
              /* Ensure toasts are above other content */
            }

            .toast {
              background-color: #26532b;
              color: #c8f1cf;
              padding: 10px 20px;
              border-radius: 5px;
              margin-bottom: 5px;
              opacity: 0;
              transition: opacity 0.3s ease-in-out;
            }

            .toast.show {
              opacity: 1;
              /* Animate toast appearance on show */
            }

            .toast-error {
              background-color: #6f1a07;
              color: #ccc;
            }

            button:hover {
              background-color: #2980b9;
            }
        </style>

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
    
    this.home.addEventListener("click", () => {
            showView("game");
    });

    this.login.addEventListener('click', (event) => {
        showSignin();
        event.stopImmediatePropagation();
    });
  }

  disconnectedCallback() {
  }

}

customElements.define('logged-out-navbar', LoggedOutNavbar);