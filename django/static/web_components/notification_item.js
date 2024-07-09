import { acceptFriendRequest } from "../notification_utils.js";

export class NotificationItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                .notification {
                    display: flex;
                    flex-direction: column;
                    padding: 10px;
                    border-bottom: 1px solid #ddd;
                }
                .notification-header {
                    font-weight: bold;
                }
                .notification-body {
                    margin-top: 5px;
                }
                .notification-actions {
                    margin-top: 10px;
                }
                .notification-actions button {
                    margin-right: 5px;
                }
            </style>
            <div class="notification">
                <div class="notification-header"></div>
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
        this.shadowRoot.querySelector('.btn-success').addEventListener('click', () => {
            this.acceptFriendRequest();
        });

        this.shadowRoot.querySelector('.btn-danger').addEventListener('click', () => {
            this.rejectFriendRequest();
        });
    }

    disconnectedCallback() {
        this.shadowRoot.querySelector('.btn-success').removeEventListener('click', this.acceptFriendRequest);
        this.shadowRoot.querySelector('.btn-danger').removeEventListener('click', this.rejectFriendRequest);
    }

    set data(notification) {
        this.notification = notification;
        this.shadowRoot.querySelector('.notification-header').textContent = `${notification.sender_username} sent you a friend request.`;
        this.shadowRoot.querySelector('.notification-body').textContent = notification.message;
    }

    acceptFriendRequest() {
        acceptFriendRequest(this.notification.id, this.notification.sender_id);
    }

    rejectFriendRequest() {
        rejectFriendRequest(this.notification.id);
    }
}

customElements.define('notification-item', NotificationItem);