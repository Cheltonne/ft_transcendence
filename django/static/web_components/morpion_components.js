import {
    getUserInfo,
    user
} from '../scripts.js'

import { getCookie, notificationSocket, showToast, getUserFromStorage } from "../utils.js";

export class MorpionComponent extends HTMLElement {
    constructor() {
        super();
		const navbar = document.createElement('template')
        navbar.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"/>
            <div class="container">
                <div id="alert-placeholder"></div>
                <h1 class="text-center pt-5">Morpion des familles</h1>
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-8 d-flex justify-content-center">
                            <div class="board" id="board">
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                                <div class="cell" data-cell></div>
                            </div>
                        </div>
                        <div class="col-4 d-flex justify-content-center align-items-center">
                            <div class="d-grid gap-2">
                                <button id="scorePlayer1" type="button" class="btn btn-info">Player 1</button>
                                <button id="scorePlayer2" type="button" class="btn btn-warning">Player 2</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-grid gap-2 col-6 mx-auto"> 
                    <button id="newGame" type="button" class="btn btn-success">Start New Game</button>  
                    <button id="matchmakingButton" type="button" class="btn btn-primary">Start Matchmaking</button>
                    <button id="newGameWithComputer" type="button" class="btn btn-secondary">Start New Game with Computer</button>
                </div> 
                <div class="winning-message" id="winningMessage">
                    <div data-winning-message-text></div>
                    <button id="restartButton" type="button" class="btn btn-dark btn-lg">Restart</button>
                </div>   
            </div> 
        `;

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(navbar.content.cloneNode(true));
        const scriptBootstrap = document.createElement('script');
        scriptBootstrap.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
        scriptBootstrap.onload = () => {
            console.log('Bootstrap loaded');
        };
        document.head.appendChild(scriptBootstrap);
	}


    connectedCallback() {
		const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'static/css/morpion.css';
        this.shadowRoot.appendChild(styleLink);

        // initialisation des variables
        this.X_CLASS = 'x';
        this.CIRCLE_CLASS = 'circle';
        this.WINNING_COMBINATIONS = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 4, 8],
            [2, 4, 6],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8]
        ];

        this.board = this.shadowRoot.getElementById('board');
        this.winningMessageElement = this.shadowRoot.getElementById('winningMessage');
        this.restartButton = this.shadowRoot.getElementById('restartButton');
        this.newGameButton = this.shadowRoot.getElementById('newGame');
        this.newGameWithComputerButton = this.shadowRoot.getElementById('newGameWithComputer');
        this.matchmakingButton = this.shadowRoot.getElementById('matchmakingButton');
        this.cellElements = this.shadowRoot.querySelectorAll('[data-cell]');
        this.winningMessageTextElement = this.shadowRoot.querySelector('[data-winning-message-text]');
        this.scorePlayer1 = this.shadowRoot.getElementById('scorePlayer1');
        this.scorePlayer2 = this.shadowRoot.getElementById('scorePlayer2');
        this.maxGames = 1;
        this.gamesPlayed = 0;
        this.scoreX = 0;
        this.scoreO = 0;
        this.seriesOver = false;
        this.alertShown = false;
        this.circleTurn = false;
        this.isAI = false;
        this.player1Name = 'Player 1';
        this.player2Name = 'Player 2';
        this.matchmacking = false;
        this.boardDisabled = true;

        this.startGame();
        this.showAlert("info", "Welcome to Morpion des familles! Choose a game to begin.");

        //////////////////////////////////////////////////////////////////////////
        //                                                                      //
        //                        EVENTS LISTENERS                              // 
        //                                                                      //
        //////////////////////////////////////////////////////////////////////////  


        // comportement des boutons new game, AI game et restart 
        this.restartButton.addEventListener('click', () => {
            if (!this.seriesOver) {
                this.restartGame();
                this.boardDisabled = false;
                this.matchmacking = false;
            } else {
                this.winningMessageElement.classList.remove('show');
                showToast('Game has ended. Press Start New Game.');
                this.boardDisabled = true;
                this.alertShown = true;
                this.resetSeries();
                this.matchmacking = false;
            }
        });

        this.newGameButton.addEventListener('click', () => {
            this.isAI = false;
            this.player1Name = getUserFromStorage().username;
            this.player2Name = 'Guest';
            this.updatePlayerNames();
            this.startGame();
            this.boardDisabled = false;
            this.matchmacking = false;
            showToast('Starting new games');
        });

        this.newGameWithComputerButton.addEventListener('click', () => {
            this.isAI = true;
            this.player1Name = getUserFromStorage().username;
            this.player2Name = "AI";
            this.updatePlayerNames();
            this.resetSeries();
            this.boardDisabled = false;
            this.startGame();
            showToast('Starting new game with computer');
        });

        this.matchmakingButton.addEventListener('click', async () => {
            this.resetSeries();
            this.player1Name = 'Player 1';
            this.player2Name = 'Player 2';
            this.boardDisabled = false;                                                          
            await this.startMatchmaking();
            showToast('Looking for a match...');
        });
    }

    async checkAuthenticated() {
        const response = await fetch('/accounts/check-authenticated/');
        const data = await response.json();
        return data.authenticated;
    }

    updatePlayerNames() {
        this.scorePlayer1.textContent = this.player1Name + ': ' + this.scoreX;
        this.scorePlayer2.textContent = this.player2Name + ': ' + this.scoreO;
    }

        //////////////////////////////////////////////////////////////////////////
        //                                                                      //
        //                             GAME LOGIC                               // 
        //                                                                      //
        //////////////////////////////////////////////////////////////////////////  


    // fonction pour commencer une partie et verifier si la serie est terminée
    startGame() {
        if (this.seriesOver) {
            this.resetSeries();
        } else {
            this.restartGame();
        }
    }

    restartGame() {
        this.circleTurn = false;
        this.cellElements.forEach(cell => {
            cell.classList.remove(this.X_CLASS, this.CIRCLE_CLASS);
            cell.removeEventListener('click', this.handleClick);
            cell.addEventListener('click', this.handleClick.bind(this), { once: true });
        });
        this.setBoardHoverClass();
        this.winningMessageElement.classList.remove('show');
        this.seriesOver = false;
    }

    startMatchmaking() {
        notificationSocket.send(JSON.stringify({ type: 'matchmaking', player_seat: window.location.hostname }));
        this.boardDisabled = true;
        this.matchmacking = true;
        notificationSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.message.includes("declined"))
                showToast(data.message, "error", 8000)
            else if (data.type === 'already_sent'){
                this.showAlert('warning', data.message);
           }
            if (data.type === 'no_match_found' || data.message.includes("declined")) {
                this.showAlert('warning', data.message);
                this.isAI = false;
                this.boardDisabled = true;
                this.player2Name = 'Guest';
                this.boardDisabled = true;
            }
            else if (data.type === 'match_request_accepted') {
                showToast(data.message, "succ", 8000)
                this.boardDisabled = false;
                this.isAI = false;
                this.player2Name = data.sender.username;
                this.player1Name = data.recipient;
                this.updatePlayerNames();

                this.cellElements.forEach(cell => {
                    cell.removeEventListener('click', this.handleClick);
                    cell.addEventListener('click', this.handleClick.bind(this), { once: true });
                });
            }
        };
    }

    // fonction pour gérer le clic sur une case
    handleClick(e) {
        if (this.seriesOver || this.boardDisabled) return;
        const cell = e.target;
        const currentClass = this.circleTurn ? this.CIRCLE_CLASS : this.X_CLASS;
        if (!cell.classList.contains(this.X_CLASS) && !cell.classList.contains(this.CIRCLE_CLASS)) {
            this.placeMark(cell, currentClass);
            if (this.checkWin(currentClass)) {
                this.endGame(false);
            } else if (this.isDraw()) {
                this.endGame(true);
            } else {
                this.swapTurns();
                this.setBoardHoverClass();  
                if (this.isAI && this.circleTurn) {
                    setTimeout(() => this.makeAIMove(), 0); // delay of 1s(subject)
                }
            }
        }
    }
    
    // fonction pour gérer la fin de la partie: soit un gagnant, soit un match nul ensuite 
    // on met à jour le score et on vérifie si la série est terminée
    endGame(draw) {
        if (draw) {
            this.winningMessageTextElement.innerText = 'Draw!';
        } else {
            let winner = this.circleTurn ? "O" : "X";
            this.winningMessageTextElement.innerText = `${winner} Wins!`;
            this.updateScore(winner);
        }
        this.winningMessageElement.classList.add('show');
        this.gamesPlayed++;
        if (this.gamesPlayed >= this.maxGames) {
            this.checkSeriesWinner();
            this.seriesOver = true;
        }
    }
    
    // fonction pour mettre à jour le score
    updateScore(winner) {
        if (winner === "X") {
            this.scoreX++;
            this.scorePlayer1.textContent = `${this.player1Name}: ${this.scoreX}`;
        } else {
            this.scoreO++;
            this.scorePlayer2.textContent = `${this.player2Name}: ${this.scoreO}`;
        }
    }

    // fonction pour vérifier si le match est nul
    isDraw() {
        return [...this.cellElements].every(cell => {
            return cell.classList.contains(this.X_CLASS) || cell.classList.contains(this.CIRCLE_CLASS);
        });
    }

    // fonction pour placer le symbole dans la case
    placeMark(cell, currentClass) {
         if (!cell.classList.contains(this.X_CLASS) && !cell.classList.contains(this.CIRCLE_CLASS)) {
            cell.classList.add(currentClass);
         }
    }

    // fonction pour changer de joueur
    swapTurns() {
        this.circleTurn = !this.circleTurn;
    }

    // fonction pour changer la classe de la case en fonction du joueur
    setBoardHoverClass() {
        this.board.classList.remove(this.X_CLASS);
        this.board.classList.remove(this.CIRCLE_CLASS);
        if (this.circleTurn) {
            this.board.classList.add(this.CIRCLE_CLASS);
        } else {
            this.board.classList.add(this.X_CLASS);
        }
    }

    // fonction pour vérifier si un joueur a gagné
    checkWin(currentClass) {
        return this.WINNING_COMBINATIONS.some(combination => {
            return combination.every(index => {
                return this.cellElements[index].classList.contains(currentClass);
            });
        });
    }

    checkSeriesWinner() {
        if (this.gamesPlayed >= this.maxGames) {
            let message;
            if (this.scoreX > this.scoreO) {
                message = `Series Winner: ${this.player1Name}`;
            } else if (this.scoreO > this.scoreX) {
                message = `Series Winner: ${this.player2Name}`;
            } else {
                message = "Series ends in a draw.";
            }
            console.log(message);
            if (this.isAI) {
                this.createMatch_ai(this.scoreX, this.scoreO);
            }else{
                this.createMatch(this.scoreX, this.scoreO);
            }
        }
    }

        //////////////////////////////////////////////////////////////////////////
        //                                                                      //
        //                        DATABASE MANAGMENT                            // 
        //                                                                      //
        //////////////////////////////////////////////////////////////////////////  


    async createMatch(user_score, alias_score,) {
        console.log("Creating match with player1:", user.username);
        const isAuthenticated = await this.checkAuthenticated();
        if (!isAuthenticated) {
            console.error("User not authenticated. Cannot create match.");
            this.showAlert("danger", "You need to be logged in to create a match.");
            return;
        }
        
        let response;
        const csrftoken = getCookie('csrftoken');
        
        if (this.matchmacking)
        {
            response = await fetch('/morpion/create-matchmacking-game/',
            {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': csrftoken, 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'player2': this.player2Name
                }),
                credentials: 'include'
            });
        }
        else
        {
            response = await fetch('/morpion/create-match/', {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        }
        if (!response.ok) {
            throw new Error(`Match creation failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.match_id) {
            console.log("Match created with ID:", data.match_id);
            showToast("Match created successfully!");
            this.sendScoreToDjango(user_score, alias_score, data.match_id, false);
        } else {
            console.log("Error creating match");
            showToast("Failed to create match. Please try again.");
        }
    }
    
    async createMatch_ai(user_score, ia_score) {
        const isAuthenticated = await this.checkAuthenticated();
        if (!isAuthenticated) {
            console.error("User not authenticated. Cannot create match.");
            return;
        }
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/morpion/create-match-ai/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.match_id) {
            console.log("Match created with ID:", data.match_id);
            showToast("Match created successfully!");
            this.sendScoreToDjango(user_score, ia_score, data.match_id, true);
        } else {
            console.error("Error creating match");
            showToast("Failed to create match. Please try again.");
        }
    }
    
    // function to send the score to the Django server
    sendScoreToDjango(scoreX, scoreO, match_id, isAI) {
        const csrftoken = getCookie('csrftoken');
        const endpoint = isAI ? "/morpion/save-score-ai/" : "/morpion/save-score/";
        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({
                player1_score: scoreX,
                player2_score: isAI ? undefined : scoreO,
                ai_score: isAI ? scoreO : undefined,
                match_id: match_id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log("Score saved successfully.");
            } else {
                console.error("Failed to save score:", data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }

        //////////////////////////////////////////////////////////////////////////
        //                                                                      //
        //                              UTILS                                   // 
        //                                                                      //
        ////////////////////////////////////////////////////////////////////////// 


    // fonction pour réinitialiser la série
    resetSeries() {
        this.gamesPlayed = 0;
        this.scoreX = 0;
        this.scoreO = 0;
        this.scorePlayer1.textContent = `Player 1`;
        this.scorePlayer2.textContent = `Player 2`;
        this.restartGame();
        this.seriesOver = false;
        this.alertShown = false;
    }

    showAlert(type, message, duration = 3000) {
        const alertPlaceholder = this.shadowRoot.getElementById('alert-placeholder');
        const alert = document.createElement('div');
        alert.className = `alert alert-secondary alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertPlaceholder.appendChild(alert);
        setTimeout(() => {
            if (alert) {
                alert.classList.remove('show');
                alert.addEventListener('transitionend', () => {
                    alert.remove();
                });
            }
        }, duration);
    }

        //////////////////////////////////////////////////////////////////////////
        //                                                                      //
        //                           AI GAME LOGIC                              // 
        //                                                                      //
        //////////////////////////////////////////////////////////////////////////  



    // fonction pour faire jouer l'ordinateur
    makeAIMove() {
        // verifie si l'IA peut gagner au prochain tour et gagne
        for (let combination of this.WINNING_COMBINATIONS) {
            const [a, b, c] = combination;
            if (this.cellElements[a].classList.contains(this.CIRCLE_CLASS) &&
                this.cellElements[b].classList.contains(this.CIRCLE_CLASS) &&
                !this.cellElements[c].classList.contains(this.X_CLASS) &&
                !this.cellElements[c].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[c], this.CIRCLE_CLASS);
                if (this.checkWin(this.CIRCLE_CLASS)) {
                    this.endGame(false);
                }
                return;
            }
            if (this.cellElements[a].classList.contains(this.CIRCLE_CLASS) &&
                this.cellElements[c].classList.contains(this.CIRCLE_CLASS) &&
                !this.cellElements[b].classList.contains(this.X_CLASS) &&
                !this.cellElements[b].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[b], this.CIRCLE_CLASS);
                if (this.checkWin(this.CIRCLE_CLASS)) {
                    this.endGame(false);
                }
                return;
            }
            if (this.cellElements[b].classList.contains(this.CIRCLE_CLASS) &&
                this.cellElements[c].classList.contains(this.CIRCLE_CLASS) &&
                !this.cellElements[a].classList.contains(this.X_CLASS) &&
                !this.cellElements[a].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[a], this.CIRCLE_CLASS);
                if (this.checkWin(this.CIRCLE_CLASS)) {
                    this.endGame(false);
                }
                return;
            }
        }
    
        // verifie si l'IA peut perdre au prochain tour et le bloque
        for (let combination of this.WINNING_COMBINATIONS) {
            const [a, b, c] = combination;
            if (this.cellElements[a].classList.contains(this.X_CLASS) &&
                this.cellElements[b].classList.contains(this.X_CLASS) &&
                !this.cellElements[c].classList.contains(this.X_CLASS) &&
                !this.cellElements[c].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[c], this.CIRCLE_CLASS);
                this.swapTurns();
                this.setBoardHoverClass();
                return;
            }
            if (this.cellElements[a].classList.contains(this.X_CLASS) &&
                this.cellElements[c].classList.contains(this.X_CLASS) &&
                !this.cellElements[b].classList.contains(this.X_CLASS) &&
                !this.cellElements[b].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[b], this.CIRCLE_CLASS);
                this.swapTurns();
                this.setBoardHoverClass();
                return;
            }
            if (this.cellElements[b].classList.contains(this.X_CLASS) &&
                this.cellElements[c].classList.contains(this.X_CLASS) &&
                !this.cellElements[a].classList.contains(this.X_CLASS) &&
                !this.cellElements[a].classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(this.cellElements[a], this.CIRCLE_CLASS);
                this.swapTurns();
                this.setBoardHoverClass();
                return;
            }
        }
    
        // prend le centre si disponible
        const centerCell = this.cellElements[4];
        if (!centerCell.classList.contains(this.X_CLASS) && !centerCell.classList.contains(this.CIRCLE_CLASS)) {
            this.placeMark(centerCell, this.CIRCLE_CLASS);
            this.swapTurns();
            this.setBoardHoverClass();
            return;
        }
    
        /*// prend un coin si possible (rend l'IA plus difficile à battre)
        const corners = [this.cellElements[0], this.cellElements[2], this.cellElements[6], this.cellElements[8]];
        for (let corner of corners) {
            if (!corner.classList.contains(this.X_CLASS) && !corner.classList.contains(this.CIRCLE_CLASS)) {
                this.placeMark(corner, this.CIRCLE_CLASS);
                this.swapTurns();
                this.setBoardHoverClass();
                return;
            }
        }*/
    
        // prend une case aléatoire
        const emptyCells = [...this.cellElements].filter(cell => {
            return !cell.classList.contains(this.X_CLASS) && !cell.classList.contains(this.CIRCLE_CLASS);
        });
    
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.placeMark(randomCell, this.CIRCLE_CLASS);
            this.swapTurns();
            this.setBoardHoverClass();
        }
    }
	disconnectedCallback() { }
}

customElements.define('morpion-view', MorpionComponent);