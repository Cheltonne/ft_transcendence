export class NotificationIcon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const container = document.createElement('div');
        container.id = 'notificationDropdown';
        container.type = 'button';

        const notificationBtn = document.createElement('span');
        notificationBtn.classList.add('material-symbols-outlined', 'notification-btn');
        notificationBtn.textContent = 'notifications';

        const notificationCounter = document.createElement('span');
        notificationCounter.id = 'notificationCounter';
        notificationCounter.classList.add('notification-counter');

        const dropdownMenu = document.createElement('div');
        dropdownMenu.classList.add('dropdown-menu-items');

        css.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
        css.rel = 'stylesheet';
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/pong_theme.css');
        this.shadowRoot.appendChild(styleLink);
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/pong_theme.css');
        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(css);

        container.appendChild(notificationBtn);
        container.appendChild(notificationCounter);
        container.appendChild(dropdownMenu);
        
        // Attach styles and elements to shadow DOM
        this.shadowRoot.append(container);

        notificationBtn.addEventListener('click', (event) => this.toggleDropdown(event));
        notificationCounter.addEventListener('click', (event) => this.toggleDropdown(event));
    }

    toggleDropdown(event) {
        event.stopImmediatePropagation();
        const existingList = this.shadowRoot.querySelector('notification-list');
        if (!existingList) {
            const list = document.createElement('notification-list');
            this.shadowRoot.querySelector('#notificationDropdown').appendChild(list);
            this.shadowRoot.querySelector('.notification-btn').classList.add('active');
        } else {
            this.shadowRoot.querySelector('#notificationDropdown').removeChild(existingList);
            this.shadowRoot.querySelector('.notification-btn').classList.remove('active');
        }
    }

    updateCounter(unreadCount) {
        const counter = this.shadowRoot.querySelector('#notificationCounter');
        if (unreadCount > 0) {
            counter.textContent = unreadCount;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }
}

customElements.define('notification-icon', NotificationIcon);
