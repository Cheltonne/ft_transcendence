var userInfo = {};
const hamMenu = document.querySelector(".ham-menu");
const menu = document.querySelector(".off-screen-menu");
const login_button = document.querySelector("#loginButton");
const index_content = document.querySelector("#index-content");
const signin_content = document.querySelector("#signin-content");
const signup_content = document.querySelector("#signup-content");
const csrftoken = getCookie('csrftoken');

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getUserInfo()
{
	$.ajax({
		url: "accounts/get-user-info/",
		type: 'GET',
		dataType: 'json',
		success: function(response)
		{
			if ('username' in response)
			{
				userInfo.username = response.username;
				userInfo.profile_picture = response.profile_picture;
				console.log('User information retrieved:', userInfo);
				loginButton.innerText = "Logout";
				loginButton.innerHTML = '<a id ="loginButton" class="button" href="accounts/logout">Logout</a>';
				loginHeading.innerText = "Welcome, " + userInfo.username;
				$('#profilePictureContainer').html('<img src="' + userInfo.profile_picture + '" class="profile-picture">');
			}
			else
			{
				console.error('Error:', response.error);
				loginButton.innerText = "Login";
				loginHeading.innerText = "Hey anon!";
			}
		},
		error: function(xhr, status, error)
		{
			console.error('Failed to retrieve user information:', error);
		}
	});
}

const fetchViewContent = async (url) => {
        const response = await fetch(url, {
		headers: { 'X-CSRFToken': csrftoken }
		});
		if (!response.ok) {
			console.log(`Error fetching Signin Form data: ${response.status	}`);
		}
		const data = await response.json();
        const html = data.form;
		const state = { form: data.form }; // Store relevant state
  		history.pushState(state, null, url); // Update history with state and URL
        signin_content.innerHTML = html;
    };

function toggleMenu() {
	menu.classList.toggle("active");
	hamMenu.classList.toggle("active");
}

async function showSignin() {
	await fetchViewContent('accounts/render-signin-form/');
	signin_content.classList.toggle("hidden");
	index_content.classList.toggle("hidden");
}

document.addEventListener("click", function(event) {
	if (menu.classList.contains("active") && !event.target.closest(".off-screen-menu")) {
		toggleMenu();
	}
});

hamMenu.addEventListener("click", () =>
	{
		toggleMenu();
		event.stopImmediatePropagation()
	}
);

login_button.addEventListener("click", () =>
	{
		showSignin();
		event.stopImmediatePropagation()
	}
);

document.addEventListener("keydown", function(event) {
	if (event.key === "m" || event.code === "KeyM") {
		hamMenu.classList.toggle("active");
		menu.classList.toggle("active");
		console.log("The 'm' key was pressed!");
	}
});

$(document).ready(function() {
	getUserInfo();
});
