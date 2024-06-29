import { setUserToStorage } from "./utils.js";

class Observer {
    update(data) {
    }
}

class Subject {
    constructor() {
        this.observers = [];
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notifyObservers(data) {
        this.observers.forEach(observer => observer.update(data));
    }
}

export class UserObservable extends Subject {
    constructor() {
        super();
        this.data = { username: '', profile_picture: '', user_matches: '', wins: 0, losses: 0 };
    }

    updateUser(data) {
        setUserToStorage(data);
        this.notifyObservers(data);
    }

    setUserData(data) {
        this.data.username = data.username;
        this.data.profile_picture = `<img src='${data.profile_picture}' class='profile-picture'></img>`;
        this.data.user_matches = data.user_matches;
        this.data.wins = data.wins;
        this.data.losses = data.losses;
        this.notifyObservers(this.data);
    }

    clearUserData() {
        this.data = {};
        this.notifyObservers(this.data);
        console.log('Cleared user data');
    }

    getObservers() {
        return (this.observers);
    }
}

export class UserObserver extends Observer {
    constructor(elements) {
        super();
        this.elements = elements;
    }

    update(data) {
        try {
            this.elements.username.forEach(element => {
                element.innerText = `Welcome, ${data.username}!`;
            })
        }
        catch (error) {
            console.log('Error while updating username: ', error);
        }
        try {
            if (data.profile_picture)
                this.elements.profile_picture.forEach(element => {
                    element.innerHTML = data.profile_picture;
                })
            else
                this.elements.profile_picture.innerHTML = '';
        }
        catch (error) {
            console.log('Error while updating profile picture: ', error);
        }
        try {
            if (data.wins)
                this.elements.wins.forEach(element => {
                    element.innerHTML = `<p>Wins: ${data.wins}</p>`;
                })
        }
        catch {
            //console.error('Error while updating number of wins');
        }
        try {
            if (data.losses)
                this.elements.losses.forEach(element => {
                    element.innerHTML = `<p>Losses: ${data.losses}</p>`;
                })
        }
        catch {
            //console.error('Error while updating number of losses');
        }
        try {
            const userProfileView = document.querySelector('user-profile-view');
            if (userProfileView)
                userProfileView.renderUserProfile(data);
        }
        catch (error) {
            console.log('Error while rendering match history cards: ', error);
        }
    }
}