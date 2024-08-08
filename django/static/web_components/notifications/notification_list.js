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
        const customEvent = new CustomEvent('notificationListActive');
        document.dispatchEvent(customEvent);
        document.addEventListener('newNotification', this.handleNewNotification);
        document.addEventListener('notificationRead', (e) => {
            console.log(e)
            console.log('ID to filter: ', e.detail.id);
            this.notifications = this.notifications.filter(notification => e.detail.id !== notification.id);
         })
    }

    disconnectedCallback() {
        console.log('notification list says: bye-bye!');
        const customEvent = new CustomEvent('notificationListClosed');
        document.dispatchEvent(customEvent);
        document.removeEventListener('newNotification', this.handleNewNotification);
    }

    displayNotifications(notifications) {
        while (this.shadowRoot.firstChild) { /*clear notifications displayed first, this is for 
        the case where a new notif comes in while the list is already displayed, to avoid displaying
        the same notification several times */
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
        this.notifications.forEach ((notification) => {
            if (notification.is_read === false) {
                const notificationItem = document.createElement('notification-item');
                notificationItem.data = notification;
                notificationItem.classList.add("notification-item");
                this.shadowRoot.appendChild(notificationItem);
            }
        });
    }

    handleNewNotification = (event) => {
        const newNotification = event.detail;
        console.log('handle new noti works');
        this.notifications.push(newNotification); //WRONG ID CRUX OF PROBLEM IS : WHY IS OLD NOTI STILL THERE EVEN AFTER REJECT BUTTON HAS BEEN CLICKED AND WHY IS NEW NOTI NOT BEING PUSHED IN ARRAY
        this.displayNotifications(this.notifications);
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