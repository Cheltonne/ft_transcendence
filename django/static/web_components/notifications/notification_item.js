import { getCookie } from "../../utils.js";
import { addFriend } from "../../user_utils.js";

export class NotificationItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <div class="notification">
                <span class="sender-pfp-container"></span>
                <div class="notification-body"></div>
                <div class="notification-actions">
                    <button class="btn btn-success">Accept</button>
                    <button class="btn btn-danger">Reject</button>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/notification_item.css'); 
        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.querySelector('.btn-success').addEventListener('click', () => {
            this.acceptFriendRequest(this.notification.id, this.notification.sender_id);
        });

        this.shadowRoot.querySelector('.btn-danger').addEventListener('click', () => {
            this.rejectFriendRequest(this.notification.id);
        });
    }

    disconnectedCallback() {
        this.shadowRoot.querySelector('.btn-success').removeEventListener('click', this.acceptFriendRequest);
        this.shadowRoot.querySelector('.btn-danger').removeEventListener('click', this.rejectFriendRequest);
    }

    set data(notification) {
        this.notification = notification;
        this.shadowRoot.querySelector('.notification-body').textContent = notification.message;
        this.shadowRoot.querySelector('.sender-pfp-container').innerHTML = `<img src="${notification.sender_pfp.replace('http://localhost/', '')}" class="sender-pfp">`
    }

    acceptFriendRequest(notificationId, senderId) {
        this.toggleNotificationRead(notificationId);
        addFriend(senderId);
        this.remove();
    }

    rejectFriendRequest(notificationId) {
        console.log('notif id: ', this.notification.id);
        this.toggleNotificationRead(notificationId);
        this.remove();
    }

    toggleNotificationRead(notificationId) {
        fetch(`accounts/notifications/${notificationId}/mark_as_read/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
    }

}

customElements.define('notification-item', NotificationItem);