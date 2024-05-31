var userInfo = {};
const hamMenu = document.querySelector(".ham-menu");
const menu = document.querySelector(".off-screen-menu");
const logo = document.querySelector(".logo");
const home_button = document.querySelector("#homeButton");
const button = document.querySelector('.loginButton, .logoutButton');
const index_content = document.querySelector("#index-content");
const signin_content = document.querySelector("#signin-content");
const signup_content = document.querySelector("#signup-content");
const userInfoCard = document.getElementById('user-info-card');
const userProfileContainer = document.getElementById('user-profile-content');
const navbar = document.getElementById("navbar");
const navlist = document.querySelector(".nav-list");
const navLastChild = navlist.children[navlist.children.length - 1];

/*	 ___________________________________
	|									|
	|		GENERAL PURPOSE FCTS		|
	|___________________________________| */

function getCookie(cname) {
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

function getUserInfo() {
	console.log("getUserInfo() called.");

	return fetch("accounts/get-user-info/")
		.then(response => response.json())
		.then(data => {
			if ('username' in data)
				fillUserData(data);
			else 
				clearUserData(data);
			return data;
		})
		.catch(error => {
			console.error('Failed to retrieve user information:', error);
			return false;
		});
}

function fillUserData(data) {
	userInfo.username = data.username;
	userInfo.profile_picture = data.profile_picture;
	userInfo.user_matches = data.user_matches;
	console.log('User information retrieved:', userInfo);

	button.innerText = "Logout";
	button.innerHTML = '<a class="logoutButton button" id="loginButton" href="#">Logout</a>';
	loginHeading.innerText = "Welcome, " + userInfo.username;
	profilePictureContainer.innerHTML = '<img src="' + userInfo.profile_picture + '" class="profile-picture">';

	const existingProfileButton = document.querySelector('.profile-button-li');
	if (!existingProfileButton) {
		const profile_btn = document.createElement('li');
		profile_btn.classList.add('profile-button-li');
		profile_btn.innerHTML = '<a href="#" class="profileButton">My Profile</a>';
		navlist.insertBefore(profile_btn, navLastChild);
	}
	if (!(document.querySelector('.match-history-cards'))) {
		renderTemplate('accounts/', 'user_profile', userProfileContainer);
	}
}

function clearUserData(data) {
	console.error('Error:', data.error);
	userInfo = {};
	button.innerText = "Login";
	loginHeading.innerText = "Hey anon!";
	profilePictureContainer.innerHTML = '';
	const profile_btn = document.querySelector('.profile-button-li');
	if (profile_btn) {
		profile_btn.parentNode.removeChild(profile_btn);
	}
	const userInfoCard = document.querySelector('.match-history-cards');
	if (userInfoCard) {
		console.log("Getting rid of userInfoCard tu connais hein");
		userInfoCard.parentNode.removeChild(userInfoCard);
	}
}


function renderTemplate(folder, template_name, element_to_modify) {
	const data = { folder: folder, template_name: template_name };
	const csrftoken = getCookie('csrftoken');
	const url = `/render-template/${folder}${template_name}/`;

	fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
		body: JSON.stringify(data)
	})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				element_to_modify.innerHTML = data.html;
			} else {
				console.error('Error rendering template:', data.error);
			}
		})
}

function showToast(message, type = 'info') {
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

/*	 ___________________________
	|							|
	|	SPA NAVIGATION FCTS		|
	|___________________________| */

async function fetchViewContent(url, view_choice) {
	const response = await fetch(url, {
		method: 'GET',
	});

	if (!response.ok) {
		console.log(`Error logging in: ${response.status}`);
	}
	else {
		const data = await response.json();
		const token = data.token;
		switch (view_choice) {
			case 1:
				signin_content.innerHTML = data.form;
				handleFormSubmit('signin');
			case 2:
				signup_content.innerHTML = data.form;
				handleFormSubmit('signup');
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
						showView('game');
						showToast('Successfully logged in!');
						getUserInfo();
					} else if (formType === 'signup') {
						showView('game');
						showToast('Signup successful!');
						getUserInfo();
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

function showView(viewName) {
	const allViews = document.querySelectorAll('[data-view]');

	for (const view of allViews) {
		const currentView = view.dataset.view;
		view.classList.toggle('hidden', currentView !== viewName);
	}
}

async function showSignin() {
	await fetchViewContent('accounts/render-signin-form/', 1);
	showView("signin");
	const signup_button = document.querySelector("#signupButton");
	signup_button.addEventListener("click", () => {
		showSignup();
		event.stopImmediatePropagation()
	}
	);
}

async function showSignup() {
	await fetchViewContent('accounts/render-signup-form/', 2);
	showView('signup');
	const signin_button = document.querySelector("#signinButton");
	signin_button.addEventListener("click", () => {
		showSignin();
		event.stopImmediatePropagation()
	}
	);
}

/*	 ___________________________
	|							|
	|	  USER_PROFILE FCTS		|
	|___________________________| */

document.addEventListener('click', (event) => {
	if (!event.target.closest('.match-history-card') && document.querySelector('.match-history-cards').classList.contains('active')) {
		document.querySelector('.match-history-cards').classList.remove('active');
		document.querySelector('.match-history-veil').classList.remove('active');
	} else if (event.target.classList.contains('view-matches-link')) {
		document.querySelector('.match-history-cards').classList.toggle('active');
		document.querySelector('.match-history-veil').classList.toggle('active');
	}
})

function renderUserProfile(userInfo) {
	console.log("renderUserProfile() called.");
	if (userInfo.user_matches) {
		const matchHistoryCards = document.querySelector('.match-history-cards');
		matchHistoryCards.innerHTML = '';

		let i = 0;
		userInfo.user_matches.forEach(match => {
			const matchCard = document.createElement('div');
			matchCard.classList.add('match-history-card');
			matchCard.innerHTML = `
			<h1>Match ${++i}</h1>
			<b> Opponent </b> <p>CPU</p>
			<b> Winner </b> <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
			<b> Score </b> <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
		`;
			matchHistoryCards.appendChild(matchCard);
		});
	}
}

/*	 ___________________________
	|							|
	|	  NAVBAR LOGIC FCTS		|
	|___________________________| */

function toggleMenu() {
	getUserInfo();
	menu.classList.toggle("active");
	hamMenu.classList.toggle("active");
}

button.addEventListener('click', (event) => {
	if (event.target.classList.contains('logoutButton')) {
		handleLogout();
		event.stopImmediatePropagation()
	}
	else {
		showSignin();
		event.stopImmediatePropagation()
	}
});

function handleLogout() {
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

document.addEventListener("click", (event) => {
	if (menu.classList.contains("active") && !event.target.closest(".off-screen-menu")) {
		toggleMenu();
	}
});

hamMenu.addEventListener("click", () => {
	toggleMenu();
	event.stopImmediatePropagation()
}
);

document.addEventListener("keydown", function (event) {
	if (event.key === "m" || event.code === "KeyM") {
		toggleMenu();
		console.log("The 'm' key was pressed!");
	}
});

home_button.addEventListener("click", () => {
	showView("game");
})

logo.addEventListener("click", () => {
	showView("game");
})

navbar.addEventListener('click', (event) => {
	if (event.target.classList.contains('profileButton')) {
		event.preventDefault();
		getUserInfo()
			.then(userInfo => {
				if (userInfo.username)
				{
					renderUserProfile(userInfo);
					showView('user-profile');
				}
				else
					showToast('Please login first.', 'error');
			})
	}
})

$(document).ready(function () {
	getUserInfo();
});
