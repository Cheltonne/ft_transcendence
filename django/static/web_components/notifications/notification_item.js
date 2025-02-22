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
            console.error('Ratio: ', e);
        }
    }

    renderNotificationActions() {
        const actionsContainer = this.shadowRoot.querySelector('.notification-actions');
        actionsContainer.innerHTML = '';

        console.log(this.notification.type);
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
                    this.markAsRead(this.notification.id);
                });
                break;
                case 'match_request':
                    actionsContainer.innerHTML = `
                        <button class="btn btn-success">Accept Match</button>
                        <button class="btn btn-danger">Reject Match</button>
                    `;
                    actionsContainer.querySelector('.btn-success').addEventListener('click', () => {
                        this.acceptMatchRequest(this.notification.sender_id);
                    });
                    actionsContainer.querySelector('.btn-danger').addEventListener('click', () => {
                        this.declineMatchRequest(this.notification.sender_id);
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
        let pfpUrl = notification.sender_pfp;
        if (pfpUrl.includes('intra.42.fr'))
            pfpUrl = pfpUrl.replace('media/https%3A/', 'https://');
        const regex = /http:\/\/made-[^\/]+\/?/;
        if (pfpUrl.match(regex))
            pfpUrl = pfpUrl.replace(regex, '');
        this.shadowRoot.querySelector('.sender-pfp-container').innerHTML = `<img src="${pfpUrl.replace('http://localhost/', '')}" class="sender-pfp">`
    }

    acceptFriendRequest(notificationId, senderId) {
        this.toggleNotificationRead(notificationId)
            .then(() => {
                addFriend(senderId);
                const customEvent = new CustomEvent('notificationRead', {
                    detail: {
                        'id': this.notification.id
                    }
                });
                document.dispatchEvent(customEvent);
                this.updateUnread();
                this.remove();
            })
            .catch(error => {
                console.error('Failed to mark notification as read:', error);
            });
    }

    async acceptMatchRequest(senderId) {
        this.toggleNotificationRead(this.notification.id)
            .then(() => {
                this.sendMatchAcceptNotification(senderId);
                const customEvent = new CustomEvent('notificationRead', {
                    detail: {
                        'id': this.notification.id
                    }
                });
                document.dispatchEvent(customEvent);
                this.updateUnread();
                this.remove();
            })
            .catch(error => {
                console.error('Failed to mark notification as read:', error);
            });
        }

    async sendMatchAcceptNotification(senderId) {
        const response = await fetch(`/morpion/matches/${senderId}/match_accept/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        });
        return response.json();
    }


    async declineMatchRequest(senderId) {
        this.toggleNotificationRead(this.notification.id)
            .then(() => {
                this.sendMatchDeclineNotification(senderId);
                const customEvent = new CustomEvent('notificationRead', {
                    detail: {
                        'id': this.notification.id
                    }
                });
                document.dispatchEvent(customEvent);
                this.updateUnread();
                this.remove();
            })
            .catch(error => {
                console.error('Failed to mark notification as read:', error);
            });
        }

    async sendMatchDeclineNotification(senderId) {
        const response = await fetch(`/morpion/matches/${senderId}/match_declined/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        });
        return response.json();
    }



    markAsRead(notificationId) {
        this.toggleNotificationRead(notificationId)
            .then(() => {
                const customEvent = new CustomEvent('notificationRead', {
                    detail: {
                        'id': this.notification.id
                    }
                });
                document.dispatchEvent(customEvent);
                this.updateUnread();
                this.remove();
            })
            .catch(error => {
                console.error('Failed to mark notification as read:', error);
            });
    }

    toggleNotificationRead(notificationId) {
        return fetch(`accounts/notifications/${notificationId}/mark_as_read/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
    }

    updateUnread (){
        fetch("accounts/notifications/unread-count/")
            .then(response => response.json())
            .then(data => {
                const customEvent = new CustomEvent('notificationsUpdated', {
                    detail: {
                        unreadCount: data.unread_count
                    }
                });
                document.dispatchEvent(customEvent);
            })
    }
}

customElements.define('notification-item', NotificationItem);