// initialisation des variables
const X_CLASS = 'x'
const CIRCLE_CLASS = 'circle'
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 4, 8],
    [2, 4, 6],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8]
]
const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningMessage');
const restartButton = document.getElementById('restartButton');
const newGameButton = document.getElementById('newGame');
const cellElements = document.querySelectorAll('[data-cell]');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const scorePlayer1 = document.getElementById('scorePlayer1');
const scorePlayer2 = document.getElementById('scorePlayer2');
const maxGames = 5;
let gamesPlayed = 0;
let scoreX = 0;
let scoreO = 0;
let seriesOver = false;
let alertShown = false;
let circleTurn;

startGame();

// comportement des boutons restart et new game
restartButton.addEventListener('click', function() {
    if (!seriesOver) {
        restartGame();
    } else {
        winningMessageElement.classList.remove('show');
        alert("Series has ended. Press 'Start New Game' to start a new series.");
        alertShown = true;
    }
});
newGameButton.addEventListener('click', startGame);

// fonction pour choisir le type de jeu : soit 5 parties, soit une nouvelle partie
function startGame() {
    if (seriesOver) {
        resetSeries();
    } else {
        restartGame();
    }
}

// fonction pour commencer une partie
function restartGame() {
    circleTurn = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS, CIRCLE_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
    seriesOver = false;
}

// fonction pour gérer le clic sur une case
function handleClick(e) {
    const cell = e.target;
    const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS;
    placeMark(cell, currentClass); 
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()){ 
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
    };
} 

// fonction pour gérer la fin de la partie: soit un gagnant, soit un match nul ensuite 
// on met à jour le score et on vérifie si la série est terminée
function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!'
    } else {
        const winner = circleTurn ? "O" : "X";
        winningMessageTextElement.innerText = `${winner}'s Wins!`;
        updateScore(winner);
    }
    winningMessageElement.classList.add('show');
    gamesPlayed++;
    if (gamesPlayed >= maxGames) {
        checkSeriesWinner();
        seriesOver = true;
    }
}

// fonction pour mettre à jour le score
function updateScore(winner) {
    if (winner === 'X') {
        scoreX++;
        scorePlayer1.textContent = `Player X: ${scoreX}`;
    } else if (winner === 'O') {
        scoreO++;
        scorePlayer2.textContent = `Player O: ${scoreO}`;
    }
}

// fonction pour vérifier si le match est nul
function isDraw() {
    return [...cellElements].every(cell => {
       return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS);
    })
}

// fonction pour placer le marqueur dans la case
function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

// fonction pour changer de joueur
function swapTurns() {
    circleTurn = !circleTurn;
}

// fonction pour changer la classe du tableau en fonction du joueur
function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(CIRCLE_CLASS);
    if (circleTurn) {
        board.classList.add(CIRCLE_CLASS);
    } else {
        board.classList.add(X_CLASS);
    }
}


// fonction pour vérifier si un joueur a gagné
function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
           return cellElements[index].classList.contains(currentClass)
        })
    })
}

// fonction pour vérifier le gagnant de la série 
//et ajouter les informations dans la dans la base de données
function checkSeriesWinner() {
    if (gamesPlayed >= maxGames) {
        if (scoreX > scoreO) {
            console.log("Series Winner: Player X");
            // information pour database ici?
        } else if (scoreO > scoreX) {
            console.log("Series Winner: Player O");
            // information pour database ici
        } else {
            console.log("Series ends in a draw.");
        }
        //resetSeries(); // start a new serie??
    }
}


//fonction pour réinitialiser la série
function resetSeries() {
    gamesPlayed = 0;
    scoreX = 0;
    scoreO = 0;
    scorePlayer1.textContent = 'Player X: 0';
    scorePlayer2.textContent = 'Player O: 0';
    restartGame();
    alertShown = false;
}
