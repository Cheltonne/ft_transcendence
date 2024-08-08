import { toggleMenu, userIsAuthenticated, initializeWebSocket } from './utils.js';
import { navigateTo, showView } from './views.js';
import { LoggedInNavbar } from './web_components/logged_in_navbar.js';
import { LoggedOutNavbar } from './web_components/logged_out_navbar.js';
import { UserProfileCard } from './web_components/user_profile_card.js';
import { FriendsComponent } from './web_components/friends-list.js';
import { UserObservable, UserObserver} from './observer.js';
import { getUserFromStorage, setUserToStorage, removeUserFromStorage } from './utils.js';
import { NotificationList } from './web_components/notifications/notification_list.js';
export const hamMenu = document.querySelector(".ham-menu");
export let menu;
export const user = new UserObservable();
export const userObserver = new UserObserver();
export const bbc = new BroadcastChannel('bbc');
export const dropDownButton = document.querySelector('.notification-btn');
export const dropdownMenu = document.querySelector('.dropdown-menu-items');
const dropDownList = document.getElementById("notificationDropdown");
const userProfileContainer = document.getElementById('user-profile-content');
const logo = document.querySelector(".logo");
const notificationCounter = document.getElementById('notificationCounter');
let	unreadCount = 0;

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
	if (dropDownButton.classList.contains('active') && !event.target.closest("notification-list")) {
		document.getElementById("notificationDropdown").removeChild(document.querySelector('notification-list'));
		dropDownButton.classList.toggle('active');
fetch("accounts/notifications/unread-count/")
	.then (response => response.json())
	.then(data => {
		const customEvent = new CustomEvent('notificationsUpdated', { 
			detail: {
				unreadCount : data.unread_count
			}
			});
		document.dispatchEvent(customEvent);
	})
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

dropDownButton.addEventListener('click', (event) => {
	event.stopImmediatePropagation();
	const existingList = document.querySelector('notification-list');
	if (existingList === null) {
		const list = document.createElement('notification-list');
		dropDownList.appendChild(list);
		console.log('clicked');
		dropDownButton.classList.add('active');
	}
	else {
		console.log('bruh');
		dropDownList.removeChild(existingList);
		dropDownButton.classList.toggle('active');
	}
})

notificationCounter.addEventListener('click', (event) => {
	if (document.querySelector('notification-list') === null) {
		event.stopImmediatePropagation();
		const list = document.createElement('notification-list');
		document.getElementById("notificationDropdown").appendChild(list);
		console.log('clicked');
		dropDownButton.classList.toggle('active');
	}
	else {
		document.getElementById("notificationDropdown").removeChild(document.querySelector('notification-list'));
		dropDownButton.classList.toggle('active');
	}
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
	updateNotificationCounter();
});


fetch("accounts/notifications/unread-count/")
	.then (response => response.json())
	.then(data => {
		const customEvent = new CustomEvent('notificationsUpdated', { 
			detail: {
				unreadCount : data.unread_count
			}
			});
		document.dispatchEvent(customEvent);
	})

function updateNotificationCounter() {
    if (unreadCount > 0) {
        notificationCounter.textContent = unreadCount;
        notificationCounter.style.display = 'block'; 
    } else {
        notificationCounter.style.display = 'none';
    }
}

document.addEventListener('notificationsUpdated', (event) => {
    unreadCount = event.detail.unreadCount;
    updateNotificationCounter();
});

document.addEventListener('notificationListActive', (e) => {
	notificationCounter.style.display = 'none';
})

document.addEventListener('notificationListClosed', (e) => {
	notificationCounter.style.display = 'block';
})