var userInfo = {};
const hamMenu = document.querySelector(".ham-menu");
const menu = document.querySelector(".off-screen-menu");

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

/* document.getElementById("scoreForm").addEventListener("submit", function(event)
	{
		event.preventDefault();
		var scoreInput = document.getElementById("scoreInput").value;
		if (/^\d+$/.test(scoreInput))
		{
			// Send the score to Django via AJAX
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "game/save-score/", true);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.onreadystatechange = function()
			{
				if (xhr.readyState === XMLHttpRequest.DONE)
                {
					if (xhr.status === 200)
                    {
						console.log("Score saved successfully.");
					}
                    else
                    {
						console.error("Failed to save score:", xhr.status);
					}
				}
			};
			xhr.send(JSON.stringify({score: parseInt(scoreInput)}));
		}
        else
		{
			alert("Please enter a valid integer score.");
		}
	}); */

	function toggleMenu() {
		menu.classList.toggle("active");
		hamMenu.classList.toggle("active");
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