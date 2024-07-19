import { getCookie } from "../../utils.js";
import { dropdownMenu } from "../../scripts.js";
import { addFriend } from "../../user_utils.js";
import { NotificationItem } from "./notification_item.js";

export class NotificationList extends HTMLElement {
    constructor() {
        super();
        this.notifications = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/notification_list.css');
        this.fetchNotifications()
            .then(data => {
                this.notifications = data;
                this.displayNotifications();
            })
            .catch(error => console.error('Error:', error)); this.fetchNotifications();
        this.displayNotifications(this.notifications);
    }

    disconnectedCallBack() {
        console.log('notification list says: bye-bye!');
    }

    displayNotifications(notifications) {
        this.notifications.forEach ((notification) => {
            if (notification.is_read === false) {
                const notificationItem = document.createElement('notification-item');
                notificationItem.data = notification;
                notificationItem.classList.add("notification-item");
                this.shadowRoot.appendChild(notificationItem);
              //  console.log(notification);
            }
        });
    }

    fetchNotifications() {
        return fetch('/accounts/notifications/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => console.error('Error:', error));
    }
}

customElements.define('notification-list', NotificationList);