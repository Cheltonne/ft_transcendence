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

export class UserObserver extends Observer {
    constructor(elements) {
        super();
        this.elements = elements;
    }

    update(data) {
        try{
            console.log('updating username...');
            this.elements.username.forEach(element => {
                element.innerText = `Welcome, ${data.username}!`;
            })
        }
        catch (error){
            console.log('Error while updating username: ', error);
        }
        try{
            console.log('updating profile picture...');
            if (data.profile_picture)
                this.elements.profile_picture.forEach(element => {
                    element.innerHTML = data.profile_picture;
                })
            else
                this.elements.profile_picture.innerHTML = '';
        }
        catch (error){
            console.log('Error while updating profile picture: ', error);
        }
        try {
            const profile = document.querySelector('user-profile-view');
            profile.renderUserProfile(data);
        }
        catch (error) {
            console.log('Error while rendering match history cards: ', error);
        }
    }
}

export class User extends Subject {
    constructor() {
        super();
        this.data = { username: '', profile_picture: '', user_matches: '' };
    }

    setUserData(data) {
        this.data.username = data.username;
        this.data.profile_picture = `<img src='${data.profile_picture}' class='profile-picture'></img>`;
        this.data.user_matches = data.user_matches;
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
