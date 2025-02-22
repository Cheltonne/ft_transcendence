import { userIsAuthenticated, getCookie, showToast, toggleMenu, handleError, initializeWebSocket, socket } from './utils.js';
import { getUserInfo, user } from './scripts.js';
import { SigninForm } from './web_components/signin_form.js';
import { SignupForm } from './web_components/signup_form.js';
import { UpdateForm } from './web_components/update_form.js';
import { MorpionComponent } from './web_components/morpion_components.js';
import { ChatView } from './web_components/chat.js';
import { OtherUserProfileCard } from './web_components/other_users_profile.js';
import { RequestFrame } from './game/pong.js';
import { ChooseUsernameForm } from './web_components/choose_username_form.js';
import { ResetPasswordForm } from './web_components/reset_password.js';
import { onoffGame } from './game/pong.js';
const authRequiredViews = ['user-profile', 'update', 'friends', 'morpion', 'chat', 'other-user-profile'];
const nonAuthViews = ['signin', 'signup', 'choose-username', 'reset-password'];

async function historyNavigation(state) {	//handles navigation through browser buttons (back/next)
	const isAuthenticated = await userIsAuthenticated();
	const { viewName, type, userId } = state;
	console.log('History navigation called, isAuth = ', isAuthenticated);

	if (authRequiredViews.includes(viewName) && !isAuthenticated) {
		handleError('You need to be logged in to access this view.');
		return;
	}
	if (nonAuthViews.includes(viewName) && isAuthenticated) {
		handleError('You are already logged in.');
		return;
	}

	if (type === 1)
		showView(viewName);
	else if (type === 3 && userId !== null)
		showView(viewName, userId);
	else
		showForm(viewName);
}

export async function navigateTo(viewName, type, userId = null) { // handles regular navigation through clicking on the app elements
	const isAuthenticated = await userIsAuthenticated();
	const state = { viewName, type, userId };

	history.pushState(state, '', viewName);

	if (authRequiredViews.includes(viewName) && !isAuthenticated) {
		handleError('You need to be logged in to access this view.');
		return;
	}
	if (nonAuthViews.includes(viewName) && isAuthenticated) {
		handleError('You are already logged in.');
		return;
	}
	const event = new CustomEvent(`reload-${viewName + '-view'}`);
	window.dispatchEvent(event);
	if (type === 1)
		showView(viewName);
	else if (type === 3 && userId !== null) {
		console.log(userId)
		showView(viewName, userId);
	}
	else
		showForm(viewName);
}

export function showView(viewName, userId = null) {
	const allViews = document.querySelectorAll('[data-view]');

	for (const view of allViews) {
		const currentView = view.dataset.view;

		if (currentView !== viewName) {
			view.classList.add('hidden');
			while (view.firstChild) {
				if (view.getAttribute('data-view') !== 'pong')
					view.removeChild(view.firstChild);
				else
					break;
			}
		}
	}
	const targetView = document.querySelector(`#${viewName}-content`);
	if (targetView) {
		if (!document.querySelector(`${viewName}-view`)) {
			const new_component = document.createElement(`${viewName}-view`);
			new_component.classList.add(`${viewName}-view`);
			if (userId !== null) {
				new_component.setAttribute('user-id', userId);
			}
			targetView.appendChild(new_component);
		}
		targetView.classList.remove('hidden');
	}
	const sidebar = document.querySelector('.sidebar');
	if (sidebar && sidebar.classList.contains('active'))
		toggleMenu();
	if (viewName !== 'pong')
		onoffGame('off');
	else if (viewName === 'pong')
		onoffGame('on');
}


export function showForm(viewName) {
	const allViews = document.querySelectorAll('[data-view]');

	if (document.querySelector(`${viewName}-form`) === null) {
		const new_component = document.createElement(`${viewName}-form`);
		new_component.classList.add(`${viewName}-form`);
		document.querySelector(`#${viewName}-content`).appendChild(new_component);
	}
	for (const view of allViews) {
		const currentView = view.dataset.view;
		if (currentView !== viewName) {
			view.classList.add('hidden');
			while (view.firstChild) {
				if (view.getAttribute('data-view') !== 'pong')
					view.removeChild(view.firstChild);
				else
					break;
			}
		}
		else
			view.classList.remove('hidden');
	}
	const sidebar = document.querySelector('.sidebar');
	if (sidebar && sidebar.classList.contains('active'))
		toggleMenu();
}

export async function handleFormSubmit(formType) {
	const formComponent = document.querySelector(`${formType}-form`);
	const formElement = formComponent.getFormElement();
	if (!formElement) {
		console.error(`Form element for "${formType}" not found!`);
		handleError('Placeholder error...wait for ERROR BRANCH pls!');
		return;
	}
	else {
		formElement.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(formElement);
			const csrftoken = getCookie('csrftoken');
			try {
				const response = await fetch(`/accounts/render-${formType}-form/`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'X-CSRFToken': csrftoken },
					body: formData,
				});
				const data = await response.json();

				if (data.success === true) {
					switch (formType) {
						case 'update': 
						case 'reset_password':
							showToast('Update successful!');
							getUserInfo()
								.then(data => {
									if (userIsAuthenticated()) {
										user.setUserData(data);
										navigateTo('user-profile', 1);
									}
									else
										handleError('You\'re not authenticated anymore!');
								});
								break;
						case 'signin':
						case 'signup':
							showToast(`${formType} success!`);
							getUserInfo();
							navigateTo('pong');
							initializeWebSocket();
							const customEvent = new CustomEvent('user-login');
							window.dispatchEvent(customEvent);
					}
				}
				else {
					if (data.errors){
						const errors = data.errors;
						if (errors.username)
							showToast(errors.username, 'error');
						if (errors.password2)
							showToast(errors.password2, 'error');
					}
					else
						showToast(data.message, 'error');
					return;
				}
			} catch (error) {
				console.error(`Error during ${formType} submission:`, error);
				handleError(`Error during ${formType} submission`);
			}
		});
	}
}

window.addEventListener('popstate', (event) => {
	if (event.state) {
		historyNavigation(event.state);
	}
});