import { getCookie, showToast, toggleMenu } from './utils.js';
import { getUserInfo, hamMenu } from './scripts.js';

const index_content = document.querySelector("#index-content");
const signin_content = document.querySelector("#signin-content");
const signup_content = document.querySelector("#signup-content");
const update_content = document.querySelector("#update-content");
const userProfileContainer = document.getElementById('user-profile-content');

export async function fetchAndRenderView(viewName, url) {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            console.error(`Error fetching view: ${response.status}`);
            return;
        }
        const data = await response.json();
        renderView(viewName, data.form);
        handleFormSubmit(viewName);
    } catch (error) {
        console.error(`Error fetching view:`, error);
    }
}

export function renderTemplate(folder, template_name, element_to_modify) {
	const data = { folder: folder, template_name: template_name };
	const csrftoken = getCookie('csrftoken');
	const url = `/render-template/${folder}${template_name}/`;

	const promise = fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
		body: JSON.stringify(data)
	})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				element_to_modify.innerHTML = data.html;
				console.log(`Succesfully modified: ${element_to_modify}`);
			} else {
				console.error('Error rendering template:', data.error);
			}
		})
		.catch(error => {
			console.log(`Error in renderTemplate() fct: ${error}`);
		})
		return promise;
}

export async function fetchViewContent(url, view_choice) {
	const response = await fetch(url, {
		method: 'GET',
	});

	if (!response.ok) {
		console.log(`Error logging in: ${response.status}`);
	}
	else {
		const data = await response.json();
		const token = data.token;
        let i = 1;
		switch (view_choice) {
			case 1:
				signin_content.innerHTML = data.form;
				handleFormSubmit('signin');
                console.log(`Case number ${i++}`);
                break;
			case 2:
				signup_content.innerHTML = data.form;
				handleFormSubmit('signup');
                console.log(`Case number ${i++}`);
                break;
			case 3:
				update_content.innerHTML = data.form;
				handleFormSubmit('update');
                console.log(`Case number 3`);
		}
	}
}

async function handleFormSubmit(formType) {
	const formElement = document.getElementById(`${formType}-form`);
	if (!formElement) {
		console.error(`Form element for "${formType}" not found!`);
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

				if (data.success) {
					if (formType === 'signin') {
						showToast('Successfully logged in!');
						getUserInfo();
						showView('game');
					} else if (formType === 'signup') {
						showToast('Signup successful!');
						getUserInfo();
						showView('game');
					} else if (formType === 'update') {
						showToast('Update successful!');
						getUserInfo()
                        .then (data => {
						    showView('user-profile');
                        });
					} else {
						console.warn(`Unknown form type: ${formType}`);
					}
				} else {
					showToast(data.message || `Error during ${formType}!`, 'error');
				}
			} catch (error) {
				console.error(`Error during ${formType} submission:`, error);
			}
		});
	}
}

export function showView(viewName) {
	const allViews = document.querySelectorAll('[data-view]');

	for (const view of allViews) {
		const currentView = view.dataset.view;
		view.classList.toggle('hidden', currentView !== viewName);
	}
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('active'))
        toggleMenu();
}

export async function showSignin() {
	await fetchViewContent('accounts/render-signin-form/', 1);
	showView("signin");
	const signup_button = document.querySelector("#signupButton");
	signup_button.addEventListener("click", (event) => {
		showSignup();
		event.stopImmediatePropagation()
	});
}

async function showSignup() {
	await fetchViewContent('accounts/render-signup-form/', 2);
	showView('signup');
	const signin_button = document.querySelector("#signinButton");
	signin_button.addEventListener("click", (event) => {
		showSignin();
		event.stopImmediatePropagation()
	}
	);
}

export function handleLogout() {
	fetch('accounts/logout/')
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				toggleMenu();
				showView('game');
				getUserInfo();
				showToast('Successfully logged out!');
			} else {
				showToast('Error during logout:', data.message || 'Unknown error')
			}
		})
		.catch(error => console.error('Error during logout request:', error));
}

export async function showUpdate() {
	await fetchViewContent('accounts/render-update-form/', 3);
	showView('update');
}