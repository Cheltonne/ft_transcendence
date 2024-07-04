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
const newGameWithComputerButton = document.getElementById('newGameWithComputer');
const cellElements = document.querySelectorAll('[data-cell]');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const scorePlayer1 = document.getElementById('scorePlayer1');
const scorePlayer2 = document.getElementById('scorePlayer2');
const maxGames = 3;
let gamesPlayed = 0;
let scoreX = 0;
let scoreO = 0;
let seriesOver = false;
let alertShown = false;
let circleTurn;
let isAI = false;

const checkAuthenticated = async () => {
    const response = await fetch('/accounts/check-authenticated/');
    const data = await response.json();
    return data.authenticated;
};

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
newGameButton.addEventListener('click', function() {
    isAI = false;
    startGame();
});
newGameWithComputerButton.addEventListener('click', function() {
    isAI = true;
    startGame();
});

/*matchmakingButton.addEventListener('click', async function() {
    await startMatchmaking();
});*/

/*// Fonction pour démarrer le matchmaking et créer une nouvelle partie
async function startMatchmaking() {
    const isAuthenticated = await checkAuthenticated();
    if (!isAuthenticated) {
        console.error("User not authenticated. Cannot create match.");
        alert("You need to be logged in to start a match.");
        return;
    }
    const response = await fetch('create-match/', {
        method: 'POST',
    });
    const data = await response.json();
    if (data.match_id) {
        console.log("Match created with ID:", data.match_id);
        matchId = data.match_id;
        player1Name = data.player1_name;
        player2Name = data.player2_name;
        updatePlayerNames();
        resetSeries();
    } else {
        console.error("Error creating match");
        alert("Failed to create match. Please try again.");
    }
}*/

// fonction pour choisir le type de jeu : soit 3 parties, soit une nouvelle partie
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
    if (seriesOver) return;
    const cell = e.target;
    let currentClass;
    if (circleTurn) {
        currentClass = CIRCLE_CLASS;
    } else {
        currentClass = X_CLASS;
    }
    placeMark(cell, currentClass); 
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) { 
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        if (isAI && circleTurn) {
            setTimeout(makeAIMove, 300);
        }
    };
}

// fonction pour gérer la fin de la partie: soit un gagnant, soit un match nul ensuite 
// on met à jour le score et on vérifie si la série est terminée
function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        let winner;
        if (circleTurn) {
            winner = "O";
        } else {
            winner = "X";
        }
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
        scorePlayer1.textContent = `Player 1: ${scoreX}`;
    } else if (winner === 'O') {
        scoreO++;
        scorePlayer2.textContent = `Player 2: ${scoreO}`;
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
        let message;
        if (scoreX > scoreO) {
            message = "Series Winner: Player 1";
        } else if (scoreO > scoreX) {
            message = "Series Winner: Player 2";
        } else {
            message = "Series ends in a draw.";
        }
        console.log(message);
        createMatch(scoreX, scoreO);
        sendScoreToDjango(scoreX, scoreO, "currentMatchId");
        //resetSeries(); // on recommence ici?
    }
}

async function createMatch(user_score, alias_score) {
	const isAuthenticated = await checkAuthenticated();
	if (!isAuthenticated) {
    console.error("User not authenticated. Cannot create match.");
    showAlert("danger", "You need to be logged in to create a match.");
    return;
  }

  const response = await fetch('create-match/', {
    method: 'POST',
  });
  const data = await response.json();
  if (data.match_id) {
    console.log("Match created with ID:", data.match_id);
    showAlert("success", "Match created successfully!");
    sendScoreToDjango(player1_score, player2_score, data.match_id);
  } else {
    console.error("Error creating match");
    showAlert("danger", "Failed to create match. Please try again.");
  }
}

function showAlert(type, message) {
    const alertPlaceholder = document.getElementById('alert-placeholder');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-bs-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    alertPlaceholder.appendChild(alert);
}

function sendScoreToDjango(scoreX, scoreO, match_id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "morpion/save-score/", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var status = xhr.status;
            if (status === 200) {
                console.log("Score saved successfully.");
            } else {
                console.error("Failed to save score:", status, xhr.statusText);
            }
        }
    };
    xhr.send(JSON.stringify({ player1_score: scoreX, player2_score: scoreO, match_id: match_id }));
}


//fonction pour réinitialiser la série
function resetSeries() {
    gamesPlayed = 0;
    scoreX = 0;
    scoreO = 0;
    scorePlayer1.textContent = 'Player 1';
    scorePlayer2.textContent = 'Player 2';
    restartGame();
    seriesOver = false;
    alertShown = false;
}

// Fonction pour faire jouer l'IA (heuristique simple)
function makeAIMove() {
    // verifie si l'IA peut gagner au prochain tour et gagne
    for (let combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (cellElements[a].classList.contains(CIRCLE_CLASS) &&
            cellElements[b].classList.contains(CIRCLE_CLASS) &&
            !cellElements[c].classList.contains(X_CLASS) &&
            !cellElements[c].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[c], CIRCLE_CLASS);
            if (checkWin(CIRCLE_CLASS)) {
                endGame(false);
                return;
            }
        }
        if (cellElements[a].classList.contains(CIRCLE_CLASS) &&
            cellElements[c].classList.contains(CIRCLE_CLASS) &&
            !cellElements[b].classList.contains(X_CLASS) &&
            !cellElements[b].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[b], CIRCLE_CLASS);
            if (checkWin(CIRCLE_CLASS)) {
                endGame(false);
                return;
            }
        }
        if (cellElements[b].classList.contains(CIRCLE_CLASS) &&
            cellElements[c].classList.contains(CIRCLE_CLASS) &&
            !cellElements[a].classList.contains(X_CLASS) &&
            !cellElements[a].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[a], CIRCLE_CLASS);
            if (checkWin(CIRCLE_CLASS)) {
                endGame(false);
                return;
            }
        }
    }

    //Verifie si le joueur peut gagner au prochain tour et le bloque
    for (let combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (cellElements[a].classList.contains(X_CLASS) &&
            cellElements[b].classList.contains(X_CLASS) &&
            !cellElements[c].classList.contains(X_CLASS) &&
            !cellElements[c].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[c], CIRCLE_CLASS);
            swapTurns();
            setBoardHoverClass();
            return;
        }
        if (cellElements[a].classList.contains(X_CLASS) &&
            cellElements[c].classList.contains(X_CLASS) &&
            !cellElements[b].classList.contains(X_CLASS) &&
            !cellElements[b].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[b], CIRCLE_CLASS);
            swapTurns();
            setBoardHoverClass();
            return;
        }
        if (cellElements[b].classList.contains(X_CLASS) &&
            cellElements[c].classList.contains(X_CLASS) &&
            !cellElements[a].classList.contains(X_CLASS) &&
            !cellElements[a].classList.contains(CIRCLE_CLASS)) {
            placeMark(cellElements[a], CIRCLE_CLASS);
            swapTurns();
            setBoardHoverClass();
            return;
        }
    }

    // prend la case centrale si elle est vide
    const centerCell = cellElements[4];
    if (!centerCell.classList.contains(X_CLASS) && !centerCell.classList.contains(CIRCLE_CLASS)) {
        placeMark(centerCell, CIRCLE_CLASS);
        swapTurns();
        setBoardHoverClass();
        return;
    }

    // prend un coin si possible (rend l'IA plus difficile à battre)
   /* const corners = [cellElements[0], cellElements[2], cellElements[6], cellElements[8]];
    for (let corner of corners) {
        if (!corner.classList.contains(X_CLASS) && !corner.classList.contains(CIRCLE_CLASS)) {
            placeMark(corner, CIRCLE_CLASS);
            swapTurns();
            setBoardHoverClass();
            return;
        }
    }*/

    // prend une case aléatoire
    const emptyCells = [...cellElements].filter(cell => {
        return !cell.classList.contains(X_CLASS) && !cell.classList.contains(CIRCLE_CLASS);
    });

    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        placeMark(randomCell, CIRCLE_CLASS);
        swapTurns();
        setBoardHoverClass();
    }
}