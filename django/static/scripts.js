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

async function fetchViewContent(url) {
	const response = await fetch(url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({username: 'your_username', password: 'your_password'}),  // Replace with form data
	});
  
	if (!response.ok) {
	  console.log(`Error logging in: ${response.status }`);
	  // Handle login errors (e.g., display error message)
	} else {
	  const data = await response.json();
	  const token = data.token;  // Extract the generated token
	  // Store the token for subsequent authenticated API requests
	  // Update application state based on login success (e.g., navigate to a different view)
	}
  }
  

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
