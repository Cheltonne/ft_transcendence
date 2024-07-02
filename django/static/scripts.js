import { toggleMenu, userIsAuthenticated, initializeWebSocket } from './utils.js';
import { navigateTo, showView } from './views.js';
import { LoggedInNavbar } from './web_components/logged_in_navbar.js';
import { LoggedOutNavbar } from './web_components/logged_out_navbar.js';
import { UserProfileCard } from './web_components/user_profile_card.js';
import { FriendsComponent } from './web_components/friends-list.js';
import { UserObservable, UserObserver} from './observer.js';
import { getUserFromStorage, setUserToStorage, removeUserFromStorage } from './utils.js';
export const hamMenu = document.querySelector(".ham-menu");
export let menu;
export const user = new UserObservable();
export const userObserver = new UserObserver();

const userProfileContainer = document.getElementById('user-profile-content');
const logo = document.querySelector(".logo");

export async function getUserInfo() {
	if (localStorage.getItem('webSocketOpen') === null && sessionStorage.getItem('webSocket')){
		sessionStorage.getItem('webSocket').close();
	}
	return fetch("accounts/get-user-info/")
		.then(response => response.json())
		.then(data => {
			loadNavbar();
			if ('username' in data)
				fillUserData(data);
			return data;
		})
		.catch(error => {
			console.error('Failed to retrieve user information:', error);
			return false;
		});
}

async function fillUserData(data) {
	if (document.querySelector('user-profile-card') === null) {
		const user_profile_card = document.createElement('user-profile-card');
		console.log('Created user profile card');
		user_profile_card.classList.add('profile');
		userProfileContainer.appendChild(user_profile_card);
	}
	setUserToStorage(data);
}

document.addEventListener("click", (event) => {	//close sidebar if click detected outside of it
	if (menu.classList.contains("active") && !event.target.closest(".sidebar")) {
		toggleMenu();
	}
});

hamMenu.addEventListener("click", (event) => {	//"hamburger menu" button -> three lines icon to open sidebar
	toggleMenu();
	event.stopImmediatePropagation()
}
);

document.addEventListener("keydown", function (event) { //open sidebar by pressing M on the keyboard
	if (event.key === "m" || event.code === "KeyM") {
		toggleMenu();
	}
});

logo.addEventListener("click", () => { //click logo to go back to pong view
	navigateTo("pong", 1);
})

async function loadNavbar() { //always serve correct version of sidebar
	const navbarContainer = document.getElementById('navbar');
	const isAuthenticated = await userIsAuthenticated();

	if (isAuthenticated && document.querySelector('logged-in-navbar') || !isAuthenticated && document.querySelector('logged-out-navbar'))
		return;
	else if (isAuthenticated && document.querySelector('logged-out-navbar')) {
		navbarContainer.removeChild(document.querySelector('.sidebar'));
		const loggedInNavbar = document.createElement('logged-in-navbar');
		loggedInNavbar.classList.add('sidebar');
		navbarContainer.appendChild(loggedInNavbar);
	}
	else if (!isAuthenticated && document.querySelector('logged-in-navbar')) {
		navbarContainer.removeChild(document.querySelector('.sidebar'));
		const loggedOutNavbar = document.createElement('logged-out-navbar');
		navbarContainer.appendChild(loggedOutNavbar);
		loggedOutNavbar.classList.add('sidebar');
	} else {
		const loggedOutNavbar = document.createElement('logged-out-navbar');
		navbarContainer.appendChild(loggedOutNavbar);
		loggedOutNavbar.classList.add('sidebar');
	}
	menu = document.querySelector('.sidebar');
}

$(document).ready(function () {
	getUserInfo();
	loadNavbar();
	history.replaceState('pong', '', 'pong');
	initializeWebSocket();
});