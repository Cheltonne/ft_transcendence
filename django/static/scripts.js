import { toggleMenu, userIsAuthenticated, initializeWebSocket, showToast, socket } from './utils.js';
import { navigateTo, showView } from './navigation.js';
import { LoggedInNavbar } from './web_components/logged_in_navbar.js';
import { LoggedOutNavbar } from './web_components/logged_out_navbar.js';
import { UserProfileCard } from './web_components/user_profile_card.js';
import { FriendsComponent } from './web_components/friends-list.js';
import { UserObservable, UserObserver } from './observer.js';
import { getUserFromStorage, setUserToStorage, removeUserFromStorage } from './utils.js';
import { NotificationList } from './web_components/notifications/notification_list.js';
import { NotificationIcon } from './web_components/notifications/notification_icon.js';
export const hamMenu = document.querySelector(".ham-menu");
export let menu;
export const user = new UserObservable();
export const userObserver = new UserObserver();
export const bbc = new BroadcastChannel('bbc');
export const dropDownButton = document.querySelector('.notification-btn');
export const dropdownMenu = document.querySelector('.dropdown-menu-items');
const userProfileContainer = document.getElementById('user-profile-content');
const logo = document.querySelector(".logo");
let	oauth_message;

export async function getUserInfo() {
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

document.addEventListener("click", (event) => {	//close sidebar if click detected outside of it / same logic w/ notif list
	if (menu.classList.contains("active") && !event.target.closest(".sidebar")) {
		toggleMenu();
	}
});

hamMenu.addEventListener("click", (event) => {	//"hamburger menu" button -> three lines icon to open sidebar
	toggleMenu();
	event.stopImmediatePropagation()
}
);

document.addEventListener("keydown", function (event) { //open sidebar by pressing M on the keyboard, not for final product
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

document.addEventListener('DOMContentLoaded', function () {
	async function isUserAuthenticated() {
		return await userIsAuthenticated();
	}

	function appendNotificationIcon() {
		const navBar = document.querySelector('nav');
		const existingIcon = navBar.querySelector('notification-icon');
		if (!existingIcon) {
			const notificationIcon = document.createElement('notification-icon');
			navBar.insertBefore(notificationIcon, navBar.querySelector('.ham-menu'));
		}
	}

	function removeNotificationIcon() {
		const navBar = document.querySelector('nav');
		const existingIcon = navBar.querySelector('notification-icon');
		if (existingIcon) {
			navBar.removeChild(existingIcon);
		}
	}

	async function toggleNotificationIcon() {
		if (await isUserAuthenticated()) {
			appendNotificationIcon();
		} else {
			removeNotificationIcon();
		}
	}

	toggleNotificationIcon();

	window.addEventListener('user-login', () => { toggleNotificationIcon(); console.log('caught login event') });
	window.addEventListener('user-logout', () => { toggleNotificationIcon(); console.log('caught logout event') });
});

window.addEventListener('beforeunload', function () { // close online status socket upon closing tab/window
    if (socket && socket.readyState === WebSocket.OPEN)
        socket.close();
});

$(document).ready(function () {
	getUserInfo();
	loadNavbar();
	const initialState = { viewName: 'pong', type: 1, userId: null };
	history.replaceState(initialState, '', 'pong');
	initializeWebSocket();
	oauth_message = JSON.parse(sessionStorage.getItem('oauth_message'));
	if (oauth_message && oauth_message.type === 'username_taken') {
		console.log('Username is taken. Please choose another one.');
		showToast(`Username ${oauth_message.would_be_username} is taken. 
			Please choose another one.`, 'error');
		navigateTo('choose-username', 2, oauth_message.oauth_id);
		window.userInfo = {
			oauth_id: oauth_message.oauth_id,
			email: oauth_message.email,
			profile_picture: oauth_message.profile_picture
		};
	}
	sessionStorage.removeItem("oauth_message");
	sessionStorage.removeItem("host");
});