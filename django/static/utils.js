import { getUserInfo } from './scripts.js';
import { menu, hamMenu } from './scripts.js';

export function getCookie(cname) {
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

export function showToast(message, type = 'info') {
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
	hamMenu.classList.toggle("active");
}