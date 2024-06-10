import { userIsAuthenticated, getCookie, showToast, toggleMenu, handleError } from './utils.js';
import { getUserInfo, hamMenu } from './scripts.js';
import { SigninForm } from './web_components/signin_form.js';
import { SignupForm } from './web_components/signup_form.js';
import { UpdateForm } from './web_components/update_form.js';

export async function handleFormSubmit(formType) {
	const formComponent = document.querySelector(`${formType}-form`);
	const formElement = formComponent.getFormElement();
	if (!formElement) {
		console.error(`Form element for "${formType}" not found!`);
		handleError('Placeholder error...wait for ERROR BRANCH pls!');
		return ;
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

				if (data.success) {
					if (formType === 'update') {
						showToast('Update successful!');
						getUserInfo()
							.then(data => {
								if (userIsAuthenticated())
									showView('user-profile');
								else
									handleError('You\'re not authenticated anymore!');
							});
					} else {
						showToast(`${formType} succ!`);
						getUserInfo();
						showView('pong');
					}
				}
			} catch (error) {
				console.error(`Error during ${formType} submission:`, error);
				handleError(`Error during ${formType} submission`);
			}
		});
	}
}

export function showView(viewName) {
	const allViews = document.querySelectorAll('[data-view]');

	if (document.querySelector(`${viewName}-view`) === null) {
		const new_component = document.createElement(`${viewName}-view`);
		new_component.classList.add(`${viewName}-view`);
		document.querySelector(`#${viewName}-content`).appendChild(new_component);
	}
	for (const view of allViews) {
		const currentView = view.dataset.view;
		view.classList.toggle('hidden', currentView !== viewName);
	}
	const sidebar = document.querySelector('.sidebar');
	if (sidebar && sidebar.classList.contains('active'))
		toggleMenu();
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
		view.classList.toggle('hidden', currentView !== viewName);
	}
	const sidebar = document.querySelector('.sidebar');
	if (sidebar && sidebar.classList.contains('active'))
		toggleMenu();
}