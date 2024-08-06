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
        this.renderNotificationActions();
    }

    disconnectedCallback() {
        try {
            const actionButtons = this.shadowRoot.querySelectorAll('button');
            actionButtons.forEach(button => button.removeEventListener('click', this.handleButtonClick));
        }
        catch (e) {
            console.error('Ratio: ',e);
        }
    }

    renderNotificationActions() {
        const actionsContainer = this.shadowRoot.querySelector('.notification-actions');
        actionsContainer.innerHTML = '';

        switch (this.notification.type) {
            case 'friend_request':
                actionsContainer.innerHTML = `
                    <button class="btn btn-success">Accept</button>
                    <button class="btn btn-danger">Reject</button>
                `;
                actionsContainer.querySelector('.btn-success').addEventListener('click', () => {
                    this.acceptFriendRequest(this.notification.id, this.notification.sender_id);
                });
                actionsContainer.querySelector('.btn-danger').addEventListener('click', () => {
                    this.rejectFriendRequest(this.notification.id);
                });
                break;
            default:
                actionsContainer.innerHTML = `
                    <button class="btn btn-primary read-btn">Mark as read</button>
                `;
                actionsContainer.querySelector('.read-btn').addEventListener('click', () => {
                    this.markAsRead(this.notification.id);
                });
        }
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

    markAsRead(notificationId) {
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