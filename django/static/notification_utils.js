import { getCookie } from "./utils.js";
import { dropdownMenu } from "./scripts.js";
import { addFriend } from "./user_utils.js";
import { NotificationItem } from "./web_components/notification_item.js";
let notificationContent = null;

export function displayNotifications(notifications) {
    dropdownMenu.innerHTML = '';

    notifications.forEach(function (notification) {
        const notificationItem = document.createElement('notification-item');
        notificationItem.data = notification;
        dropdownMenu.appendChild(notificationItem);
        console.log(notification);
    });
}

export function acceptFriendRequest(notificationId, senderId){
    toggleNotificationRead(notificationId);
    addFriend(senderId);
}

export function rejectFriendRequest(notificationId) {
    toggleNotificationRead(notificationId);
    notificationContent.innerHTML = '';
}

export function toggleNotificationRead(notificationId) {
    fetch(`accounts/notifications/${notificationId}/mark_as_read/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            is_read: true
        }),
    })
    /*
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => console.error('Error:', error));
        */
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
        displayNotifications(data);
    })
    .catch(error => console.error('Error:', error));
}