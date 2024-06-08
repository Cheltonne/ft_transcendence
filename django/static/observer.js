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
        /*
        if (data.user_matches) {
            this.renderMatches(data.user_matches);
        }
    }
    renderMatches(matches) {
        const matchHistoryCards = this.elements.match_history_cards;
        matchHistoryCards.innerHTML = '';
        
        matches.forEach((match, index) => {
            const matchCard = document.createElement('div');
            matchCard.classList.add('match-history-card');
            matchCard.innerHTML = `
                <h1>Match ${index + 1}</h1>
                <b>Opponent</b> <p>CPU</p>
                <b>Winner</b> <p>${match.winner__username === data.username ? match.winner__username : "CPU"}</p>
                <b>Score</b> <p>${data.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
            `;
            matchHistoryCards.appendChild(matchCard);
        });
    */
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
