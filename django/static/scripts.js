var userInfo = {};

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
                console.log('User information retrieved:', userInfo);
            }
            else
            {
                console.error('Error:', response.error);
            }
        },
        error: function(xhr, status, error)
        {
            console.error('Failed to retrieve user information:', error);
        }
    });
}

function checkAuthStatus()
{
    $.ajax(
    {
        url: "accounts/check-auth",
        type: 'GET',
        dataType: 'json',
        success: function(response)
        {
            if (response.authenticated)
            {
                loginButton.innerText = "Logout";
				loginButton.innerHTML = '<a type="button" id ="loginButton" class="btn btn-outline-dark" style="margin: 5rem;" href="accounts/logout">Logout</a>';
                loginHeading.innerText = "Welcome, " + userInfo.username;
				$('#profilePictureContainer').html('<img src="' + userInfo.profile_picture + '" class="profile-picture">');
            }
            else
            {
                loginButton.innerText = "Login";
                loginHeading.innerText = "Hey anon!";
            }
        },
        error: function(xhr, status, error)
        {
            console.error("Failed to check authentication status:", error);
        }
    });
}

document.getElementById("scoreForm").addEventListener("submit", function(event)
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
	});

$(document).ready(function() {
    getUserInfo();
    checkAuthStatus();
});
