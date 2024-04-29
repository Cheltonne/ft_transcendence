var userInfo = {};
const hamMenu = document.querySelector(".ham-menu");
const menu = document.querySelector(".off-screen-menu");
const login_button = document.querySelector("#loginButton");
const index_content = document.querySelector("#index-content");
const signin_content = document.querySelector("#signin-content");
const signup_content = document.querySelector("#signup-content");

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
				loginButton.innerHTML = '<a type="button" id ="loginButton" class="btn btn-outline-dark" style="margin: 5rem;" href="accounts/logout">Logout</a>';
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

function toggleMenu() {
	menu.classList.toggle("active");
	hamMenu.classList.toggle("active");
}

function showSignin() {
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
