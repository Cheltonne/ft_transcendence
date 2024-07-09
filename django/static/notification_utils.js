import { getCookie } from "./utils.js";
import { dropdownMenu } from "./scripts.js";
import { addFriend } from "./user_utils.js";
let notificationContent = null;

export function displayNotifications(notifications) {
    dropdownMenu.innerHTML = '';  // Clear existing notifications

    notifications.forEach(function (notification) {
        var notificationItem = document.createElement('a');
        notificationItem.classList.add('dropdown-item');

        notificationContent = `
                <div>
                    <strong>${notification.sender}</strong> sent you a friend request.<br>
                    ${notification.message}
                </div>
                <div>
                    <button class="btn btn-success" z-index="2">Accept</button>
                    <button class="btn btn-danger">Reject</button>
                </div>
                <script>
                const acceptButton = notificationItem.querySelector('.btn-success');
                const rejectButton = notificationItem.querySelector('.btn-danger');

                acceptButton.addEventListener('click', (event) => {
                    acceptFriendRequest(notification.id, notification.sender_id);
                });

                rejectButton.addEventListener('click', () => {
                    rejectFriendRequest(notification.id);
                });
                </script>
            `;
        notificationItem.innerHTML = notificationContent;
        dropdownMenu.appendChild(notificationItem);
    });
}

export function acceptFriendRequest(notificationId, senderId){
    toggleNotificationRead(notificationId);
    addFriend(senderId);
    notificationContent.innerHTML = '';
}

export function rejectFriendRequest(notificationId) {
    // Implement logic to handle rejecting friend request
    toggleNotificationRead(notificationId);
    // Other relevant actions
}

export function toggleNotificationRead(notificationId) {
    // Send API request to mark notification as read
    fetch(`/api/notifications/${notificationId}/mark_as_read/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,  // Ensure the user is authenticated
        },
        body: JSON.stringify({
            is_read: true
        }),
    })
        .then(response => response.json())
        .then(data => {
            // Handle success or error response
        })
        .catch(error => console.error('Error:', error));
}

export function fetchNotifications() {
    fetch('/accounts/notifications/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        displayNotifications(data);  // Call function to display notifications
    })
    .catch(error => console.error('Error:', error));
}