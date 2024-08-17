export class NotificationIcon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        container.id = 'notificationDropdown';
        container.type = 'button';

        const notificationBtn = document.createElement('img');
        notificationBtn.classList.add('notification-btn');
        notificationBtn.src = '/media/bell.png';

        const notificationCounter = document.createElement('span');
        notificationCounter.id = 'notificationCounter';
        notificationCounter.classList.add('notification-counter');

        const dropdownMenu = document.createElement('div');
        dropdownMenu.classList.add('dropdown-menu-items');

        const styleLink2 = document.createElement('link');
        styleLink2.setAttribute('rel', 'stylesheet');
        styleLink2.setAttribute('href', '/static/css/pong_theme.css');
        this.shadowRoot.appendChild(styleLink2);

        const style = document.createElement('style');
        style.textContent = `
            #notificationDropdown {
            position: absolute;
            margin-left:75%;
            z-index: 4200;
            }

            .notification-btn {
                position: relative;
                display: inline-block;
                width: 24px; 
                cursor: pointer;
                transition: background-color 0.3s;
            }
        `;
        this.shadowRoot.appendChild(style);

        container.appendChild(notificationBtn);
        container.appendChild(notificationCounter);
        container.appendChild(dropdownMenu);
        
        // Attach styles and elements to shadow DOM
        this.shadowRoot.append(container);

        notificationBtn.addEventListener('click', (event) => this.toggleDropdown(event));
        notificationCounter.addEventListener('click', (event) => this.toggleDropdown(event));
    }

    connectedCallback(){
        const dropDownButton = this.shadowRoot.querySelector('.notification-btn');

        document.addEventListener("click", (event) => {	
            if (dropDownButton.classList.contains('active') && !event.target.closest("notification-list")) {
                document.getElementById("notificationDropdown").removeChild(document.querySelector('notification-list'));
                dropDownButton.classList.toggle('active');
            }
        });
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