import { getUserInfo } from './scripts.js';
import { menu, hamMenu } from './scripts.js';
import { showView } from './views.js';

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

export function handleError(message, view='pong')
{
	showToast(message, 'error');
	showView(view);
}

export function handleLogout() {
	fetch('accounts/logout/')
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				toggleMenu();
				showView('pong');
				getUserInfo();
				showToast('Successfully logged out!');
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