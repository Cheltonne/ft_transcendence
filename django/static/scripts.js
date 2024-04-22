function checkAuthStatus() {
	// Make an AJAX request to the server to check if the user is authenticated
	// You can use Django's {% url %} template tag to generate the URL for the AJAX request
	// For example:
	// var url = "{% url 'check_auth_status' %}";
	// Replace 'check_auth_status' with the name of the view that checks the authentication status
	// Once you receive the response, update the login button and navbar accordingly
	// For demonstration purposes, I'll assume the response is a JSON object with a 'authenticated' field
	var isAuthenticated = true;  // Replace this with the actual value from the server response

	// Update the login button and navbar based on the authentication status
	var loginButton = document.getElementById('loginButton');
	var loginHeading = document.getElementById('loginHeading');
	if (isAuthenticated) {
		loginButton.innerText = "Logout";
		loginHeading.innerText = "Welcome, Username";  // Replace 'Username' with the actual username
	} else {
		loginButton.value = "Login";
		loginHeading.innerText = "Login";
	}
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
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						console.log("Score saved successfully.");
						// Optionally, display a success message or perform other actions
					} else {
						console.error("Failed to save score:", xhr.status);
						// Optionally, display an error message or perform other actions
					}
				}
			};
			xhr.send(JSON.stringify({score: parseInt(scoreInput)}));
		} else
		{
			alert("Please enter a valid integer score.");
		}
	});

window.onload = checkAuthStatus();
