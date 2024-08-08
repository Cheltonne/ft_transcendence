import { getUserInfo, menu, hamMenu, bbc } from './scripts.js';
import { navigateTo } from './views.js';
export let socket = null;
export let notificationSocket = null;
export const USER_STORAGE_KEY = 'user';

export function getCookie(cname) { // to get CSRF cookie (necessary for forms)
	let name = cname + '=';
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

export function showToast(message, type = 'info') { //show toast notification on top right, besides hamburger menu button
	const toast = document.createElement('div');
	toast.classList.add('toast');
	toast.textContent = message;

	if (type === 'success') {
		toast.classList.add('toast-success');
	} else if (type === 'error') {
		toast.classList.add('toast-error');
	}

	const toastContainer = document.querySelector('.toast-container');
	toastContainer.appendChild(toast);

	toast.classList.add('show');

	setTimeout(() => {
		toast.classList.remove('show');
		toastContainer.removeChild(toast);
	}, 3000);
}

export function toggleMenu() {
	getUserInfo();
	menu.classList.toggle("active");
	if (menu.classList.contains('active') && hamMenu.classList.contains('active') === false)
		hamMenu.classList.toggle("active");
	else if (menu.classList.contains('active') === false && hamMenu.classList.contains('active'))
		hamMenu.classList.toggle("active");
}

export function handleError(message, view = 'pong') {
	showToast(message, 'error');
	navigateTo(view, 1);
}

export function handleLogout() {
	fetch('accounts/logout/')
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				toggleMenu();
				navigateTo('pong', 1);
				getUserInfo();
				showToast('Successfully logged out!');
				if (socket && socket.readyState === WebSocket.OPEN) {
					socket.close();
					console.log('closed socket after logout.');
				}
				removeUserFromStorage();
				const friendsListElement = document.querySelector('friends-view');
				if (friendsListElement) {
					friendsListElement.remove();
				}
				bbc.postMessage('loggedOut');
			} else {
				showToast('Error during logout:', data.message || 'Unknown error')
			}
		})
		.catch(error => console.error('Error during logout request:', error));
}

export async function userIsAuthenticated() {
	const response = await fetch('accounts/check-authenticated/');
	const data = await response.json();
	return data.authenticated;
}

export async function initializeWebSocket() {
	const authToken = await userIsAuthenticated();

	if (authToken && socket === null) {
		socket = new WebSocket('wss://' + window.location.host + '/ws/accounts/');
		notificationSocket = new WebSocket('wss://' + window.location.host + '/ws/notifications/');

		socket.onopen = function (event) {
			console.log('WebSocket is open now.');
		};

		socket.onclose = function (event) {
			console.log('WebSocket is closed.');
			socket = null; // Reset socket variable when closed
		};

		bbc.addEventListener('message', (e) => {
			socket.close();
		})

		socket.onerror = function (error) {
			console.error('WebSocket encountered error:', error);
		};

		notificationSocket.onmessage = async function (e) {
			const data = JSON.parse(e.data);
			console.log('Notification:', data);
			if (data.sender && data.type === 'friend_request') {
				showToast(`${data.sender} wants to add you as a friend.`);
			}
            if (document.querySelector('notification-list') === null) { //avoid showing the counter if the notif list is open
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
			else {
				const newNotificationEvent = new CustomEvent('newNotification', { 
            		detail: data 
        		});
				document.dispatchEvent(newNotificationEvent);
				console.log('data: ', data)
			}
			};

		notificationSocket.onclose = function (e) {
			console.log('Notification socket closed.');
			notificationSocket = null;
		};
	} else {
		console.log('User is not authenticated.'); // Handle case where authToken is not available
	}
}

export function getUserFromStorage() {
	const userData = sessionStorage.getItem(USER_STORAGE_KEY);
	return userData ? JSON.parse(userData) : null;
}

export function setUserToStorage(user) {
	sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function removeUserFromStorage() {
	sessionStorage.removeItem(USER_STORAGE_KEY);
}