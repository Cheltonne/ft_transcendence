var userInfo = {};
const hamMenu = document.querySelector(".ham-menu");
const menu = document.querySelector(".off-screen-menu");
const login_button = document.querySelector("#loginButton");
const index_content = document.querySelector("#index-content");
const signin_content = document.querySelector("#signin-content");
const signup_content = document.querySelector("#signup-content");
const signinForm = document.getElementById('signin-form');
const csrftoken = getCookie('csrftoken');

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
	$.ajax({
		url: "accounts/get-user-info/",
		type: 'GET',
		dataType: 'json',
		success: function (response) {
			if ('username' in response) {
				userInfo.username = response.username;
				userInfo.profile_picture = response.profile_picture;
				console.log('User information retrieved:', userInfo);
				loginButton.innerText = "Logout";
				loginButton.innerHTML = '<a id ="loginButton" class="button" href="accounts/logout">Logout</a>';
				loginHeading.innerText = "Welcome, " + userInfo.username;
				$('#profilePictureContainer').html('<img src="' + userInfo.profile_picture + '" class="profile-picture">');
			}
			else {
				console.error('Error:', response.error);
				loginButton.innerText = "Login";
				loginHeading.innerText = "Hey anon!";
			}
		},
		error: function (xhr, status, error) {
			console.error('Failed to retrieve user information:', error);
		}
	});
}

function toggleMenu() {
	menu.classList.toggle("active");
	hamMenu.classList.toggle("active");
}

async function fetchViewContent(url, view_choice) {
	const response = await fetch(url, {
		method: 'GET',
	});

	if (!response.ok) {
		console.log(`Error logging in: ${response.status}`);
		// Handle login errors (e.g., display error message)
	} else {
		const data = await response.json();
		const token = data.token;  // Extract the generated token
		if (view_choice == 1) {
			signin_content.innerHTML = data.form;
			handleSignInForm();
		}
		else if (view_choice == 2) {
			signup_content.innerHTML = data.form;
			const event = new Event('submit');
			handleFormSubmit(event, 'signup');
		}
	}
}

function showView(viewName) {
	const allViews = document.querySelectorAll('[data-view]');
  
	for (const view of allViews) {
	  const currentView = view.dataset.view;  // Access data-view value
	  view.classList.toggle('hidden', currentView !== viewName);  // Toggle hidden class
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
	signin_content.classList.toggle("hidden");
	signup_content.classList.toggle("hidden");
}

async function handleSignInForm() {
	const signinForm = document.getElementById('signin-form');

	if (signinForm) {
		signinForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(signinForm);

			const response = await fetch('accounts/render-signin-form/', {
				method: 'POST',
				credentials: 'include',
				headers: { 'X-CSRFToken': csrftoken },
				body: formData,
			})
			const data = await response.json();
			if (data.success) {

				showSignin();
				getUserInfo();
			}
			else {
				alert(data.message || "Login failed!");
			}
		});
	}
	else {
		console.error('Sign-in form element not found!');
	}
}

async function handleFormSubmit(event, formType) {
	event.preventDefault();

	const formElement = document.getElementById(`${formType}-content`);  // Dynamic form selection
	if (!formElement) {
		console.error(`Form element for "${formType}" not found!`);
		return;
	}

	const formData = new FormData(formElement);

	try {
		const response = await fetch(`/accounts/render-${formType}-form/`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'X-CSRFToken': csrftoken }, // Include CSRF token
			body: formData,
		});

		const data = await response.json();

		if (data.success) {
			if (formType === 'signin') {
				showSignin();  // Handle successful signin
			} else if (formType === 'signup') {
				// Handle successful signup (e.g., show success message, redirect)
				alert(data.message || "Signup successful!");
				// Consider redirecting or showing a success message on the current page
			} else {
				console.warn(`Unknown form type: ${formType}`);
			}
		} else {
			alert(data.message || `Error during ${formType}!`);
		}
	} catch (error) {
		console.error(`Error during ${formType} submission:`, error);
	}
}


document.addEventListener("click", function (event) {
	if (menu.classList.contains("active") && !event.target.closest(".off-screen-menu")) {
		toggleMenu();
	}
});

hamMenu.addEventListener("click", () => {
	toggleMenu();
	event.stopImmediatePropagation()
}
);

login_button.addEventListener("click", () => {
	showSignin();
	event.stopImmediatePropagation()
}
);

document.addEventListener("keydown", function (event) {
	if (event.key === "m" || event.code === "KeyM") {
		hamMenu.classList.toggle("active");
		menu.classList.toggle("active");
		console.log("The 'm' key was pressed!");
	}
});

$(document).ready(function () {
	getUserInfo();
});
