export let RequestFrame = false;
const canvas = document.querySelector('canvas');
const MenuButton = document.getElementById('MenuButton');
const ctx = canvas.getContext("2d");
const MAX_ROUNDS = 3;
let currentRound = 1;
var ReDrawStatic = true;
var gameEnding = false;
let player2Name = 'guest';
var allButtonOk = false;
var AI = false;
let AIplayer = null;
var userInfo = {username: 'player1'};
let Ball = null;
let Paddle1 = null;
let Paddle2 = null;
let keysPressed = {};
let lastFrameTime = performance.now();
const LocalButton = document.getElementById("LocalButton");
const AIButton = document.getElementById("AIButton");
const TourneyButton = document.getElementById("TourneyButton");
var title = true;
const nameTourney = document.getElementById("nameTourney");
const nextButton = document.getElementById("nextButton");
let participantNames = [];
const NextMatchButton = document.getElementById("NextMatchButton");
let matches = [];
const tournamentTree = document.getElementById('tournamentTree');
const EndTourneyButton = document.getElementById("EndTourneyButton");
const myButton = document.getElementById("myButton");
let TourneyMode = false;
const message = document.getElementById("message");

////////////////////////////////////////////////////////
////////////////HTML CSS////////////////////////////////
////////////////////////////////////////////////////////

setCanvasSize();
function setCanvasSize() {
    canvas.width = 860;
    canvas.height = 430; 
}

LocalButton.addEventListener("click", function() {
    allButtonOk = true;
    console.log("local");
    AI = false;
    LocalButton.style.display = 'none';
    AIButton.style.display = 'none';
    TourneyButton.style.display = 'none';
    player2Name = 'guest';
    $("#aliasContainer").text(userInfo.username + " VS " + player2Name);
    clear();
    LaunchGame();
});

AIButton.addEventListener("click", function() {
    allButtonOk = true;
    console.log("IA");
    AI = true;
    player2Name = 'AI';
    LocalButton.style.display = 'none';
    AIButton.style.display = 'none';
    TourneyButton.style.display = 'none';
    hideTourneyButtons();
    $("#aliasContainer").text(userInfo.username + " VS " + " AI");
    clear();
    LaunchGame();
});

EndTourneyButton.addEventListener("click", function() {
        clearTourney();
        ModeChoice();
        EndTourneyButton.style.display = 'none';
})

function findMatchWithNullWinner() {
    for (let i = 0; i < matches.length; i++) {
        if (matches[i].state === 0 || matches[i].state === undefined) {
            return matches[i];
        }
    }
    return null;
}

NextMatchButton.addEventListener("click", function() {
    allButtonOk = true;
    console.log("TourneyMatch");
    AI = false;
    LocalButton.style.display = 'none';
    AIButton.style.display = 'none';
    TourneyButton.style.display = 'none';
    let array = findMatchWithNullWinner();
    $("#aliasContainer").text(array.player1 + " VS " + array.player2);
    clear();
    tournamentTree.style.display = 'none';
    NextMatchButton.style.display = 'none';
    LaunchGame();
});

TourneyButton.addEventListener("click", function() {
    allButtonOk = true;
    console.log("Tourney");
    LocalButton.style.display = 'none';
    AIButton.style.display = 'none';
    hideTourneyButtons();
    TourneyMode = true;
    clear();
    TourneyScreen();
});

function TourneyScreen() {
    ctx.save();
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    let text = `Player ${participantNames.length + 1} `;
    let textWidth = ctx.measureText(text).width;
    let x = canvas.width / 2;
    let y = canvas.height / 2 - 50;
    ctx.clearRect(x - textWidth / 2 - 10, y - 50, textWidth + 20, 70);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);
    ctx.restore();

    nameTourney.style.display = 'inline-block';
    nextButton.style.display = 'inline-block';
}

function hideTourneyButtons() {
    let text = `Player ${participantNames.length + 1} `;
    let textWidth = ctx.measureText(text).width;
    let x = canvas.width / 2;
    let y = canvas.height / 2 - 50;

    ctx.clearRect(x - textWidth / 2 - 10, y - 50, textWidth + 20, 70);

    TourneyButton.style.display = 'none';
    nameTourney.style.display = 'none';
    nextButton.style.display = 'none';
}

async function updateNextMatchButton() {
    let array = findMatchWithNullWinner(matches);

    if (array !== null) {
        document.getElementById("aliasContainer").textContent = `${array.player1} VS ${array.player2}`;
        NextMatchButton.innerHTML = `${array.player1} VS ${array.player2}`;
        NextMatchButton.style.display = 'inline-block';
    } else {
        NextMatchButton.innerHTML = 'Next Match';
    }
    if (array !== null)
        await fetch(`game/broadcast-tournament/${array.player1}/${array.player2}/`, {'method': 'GET'})

}

function drawTournamentTree() {
    hideTourneyButtons();
    tournamentTree.style.display = 'inline-block';
    tournamentTree.innerHTML = '';
    
    ctx.save();
    const round = document.createElement('div');
    round.className = 'round';
    let Matchid = 0;
    participantNames.forEach((participantName, index) => {
        if (index % 2 === 0) {
            const match = document.createElement('div');
            match.className = 'match';
            match.innerHTML = 'match ' + ++Matchid;
            
            const p1 = document.createElement('div');
            p1.className = 'participant';
            p1.textContent = participantName;
            match.appendChild(p1);
            
            const divider = document.createElement('div');
            divider.className = 'divider';
            divider.textContent = 'VS';
            match.appendChild(divider);
            
            if (participantNames[index + 1] !== undefined) {
                const p2 = document.createElement('div');
                p2.className = 'participant';
                p2.textContent = participantNames[index + 1];
                match.appendChild(p2);
            }
            matches[Matchid - 1] = { matchId: Matchid, state: 0, player1: participantName, player2: participantNames[index + 1], score: [0, 0], winner: null, final: false};
            round.appendChild(match);
        }
    });
    tournamentTree.appendChild(round);

    const match = document.createElement('div');
    match.className = 'match';
    match.innerHTML = 'finals';
    const p1 = document.createElement('div');
    p1.className = 'participant';
    p1.textContent = 'winner 1';
    p1.id = 'winner1';
    match.appendChild(p1);

    const divider = document.createElement('div');
    divider.className = 'divider';
    divider.textContent = 'VS';
    match.appendChild(divider);

    const p2 = document.createElement('div');
    p2.className = 'participant';
    p2.textContent = 'winner 2';
    p2.id = 'winner2';
    match.appendChild(p2);
    round.appendChild(match);

    match.classList.add('final-match');
    matches[2] = { matchId: Matchid + 1, state: 0, player1: null, player2: null, score: [0, 0], winner: null, final: true};

    updateNextMatchButton();
}

function displayMessage(msg) {
    if (msg === "") {
        message.style.visibility = "hidden";
    } else {
        message.textContent = msg;
        message.style.visibility = "visible";
    }
}

nextButton.addEventListener("click", function() {
    let alias = nameTourney.value.trim();

    if (alias === "") {
        displayMessage("please enter an alias.");
    }
    else if (participantNames.includes(alias)) {
        displayMessage("this alias is already taken.");
    }
    else {
        let savedName = alias;
        console.log(`Saved name: ${savedName}`);
        participantNames.push(alias);

        nameTourney.value = "";
        displayMessage("");  // Clear any previous messages

        if (participantNames.length != 4)
            TourneyScreen();
        else {
            drawStaticElements();
            drawTournamentTree();
        }
    }
});

function clear(){
    currentRound = 1;
    ReDrawStatic = true;
    gameEnding = false;
    AIplayer = null;
    Ball = null;
    Paddle1 = null;
    Paddle2 = null;
    nameTourney.value = "";
    EndTourneyButton.style.display = 'none';
    NextMatchButton.style.display = 'none';
    keysPressed = {};
}

function clearTourney() {
    matches = [];
    participantNames = [];
    TourneyMode = false;
    tournamentTree.style.display = 'none';
    $("#aliasContainer").text('');
}

EnterScreen();

function EnterScreen(){
    title = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    LocalButton.style.display = 'none';
    AIButton.style.display = 'none';
    TourneyButton.style.display = 'none';
    ctx.save();
    myButton.style.display = "inline-block";
    ctx.fillStyle = '#fff';
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', canvas.width / 2, canvas.height / 2 - 50);

    ctx.restore();
}

document.addEventListener("DOMContentLoaded", function() {
    giveName();
    EnterScreen();
    myButton.addEventListener("click", function() {
        myButton.style.display = "none";
        ModeChoice();
    });
});


function ModeChoice(){
    LocalButton.style.display = 'inline-block';
    AIButton.style.display = 'inline-block';
    TourneyButton.style.display = 'inline-block';
    drawStaticElements();
}

function MenuChoice(){
    MenuButton.style.display = 'inline-block';
}

MenuButton.style.display = "none";

MenuButton.addEventListener("click", function() {
    MenuButton.style.display = "none";
    $("#aliasContainer").text("");
    clearTourney();
    ModeChoice();
});


///////////////////////////////////////////////
//////////////////BINDINGS/////////////////////
///////////////////////////////////////////////

function simulateKeyPress(key, type) {
    const event = new KeyboardEvent(type, { key });
    document.dispatchEvent(event);
}

function Bindings(upKey, downKey) {
    return { up: upKey, down: downKey };
}

document.addEventListener('keyup', function(event) {
    delete keysPressed[event.key];
});

document.addEventListener('keydown', function(event) {
   keysPressed[event.key] = true;
});


///////////////////////////////////////////////
//////////////PONG LOGIC///////////////////////
///////////////////////////////////////////////

function vec2(x, y) {
    return { x: x, y: y };
}

class PongBall {
    constructor(pos) {
        this.pos = pos;
        this.prevpos = pos;
        this.velocity = vec2(0, 0);
        this.radius = 8;
        this.speed = 0.5;
        this.left = null;
        this.LastHit = null;
        this.trailLength = 10;
        this.trailOpacity = 0.1;
        this.trailPositions = [];
        this.goal = false;
        this.nextPos = false;
        this.launch = true;
        this.LastCollision = null;
    }

    resetSpeed() {
        this.speed = 0.5;
    }

    CheckEdge(nextPos) {
        if (nextPos.y + this.radius > canvas.height && this.LastHit !== 1) {
            this.velocity.y *= -1;
            this.LastHit = 1;
        }
        if (nextPos.y - this.radius < 0 && this.LastHit !== 2) {
            this.velocity.y *= -1;
            this.LastHit = 2;
        }
    }

    resetBall() {
        if (this.left)
            {
            this.velocity = vec2(1, 1);
            this.pos = vec2(Paddle1.pos.x, Paddle1.pos.y + 50);
            }
        else
            {
            this.velocity = vec2(-1, -1);
            this.pos = vec2(Paddle2.pos.x, Paddle2.pos.y + 50);
            }
        this.resetSpeed();
        this.LastHit = null;
        this.launch = true;
    }

    collision(Paddle, pos) {
        Paddle.Top = Paddle.pos.y;
        Paddle.Bottom = Paddle.pos.y + Paddle.height;
        Paddle.Left = Paddle.pos.x;
        Paddle.Right = Paddle.pos.x + Paddle.width;
    
        let top = pos.y - this.radius;
        let bottom = pos.y + this.radius;
        let left = pos.x - this.radius;
        let right = pos.x + this.radius;
    
        return right > Paddle.Left && top < Paddle.Bottom && left < Paddle.Right && bottom > Paddle.Top;
    }

    getNextPosition(dt) {
        this.prevpos = this.pos;
        return vec2(
            this.pos.x + this.velocity.x * dt * 1000,
            this.pos.y + this.velocity.y * dt * 1000
        );
    }

    launchBall() {
            this.resetSpeed();
            let direction = this.left ? 1 : -1;
            const randomNumber = Math.random() * Math.PI / 4;
            this.velocity.x = direction * this.speed * Math.cos(randomNumber);
            this.velocity.y = this.speed * Math.sin(randomNumber);
            this.launch = false;
            this.LastCollision = null;
    }

    update(deltaTime) {
        this.nextPos = this.getNextPosition(deltaTime);
        this.CheckEdge(this.nextPos);

        let player = (this.pos.x < canvas.width / 2) ? Paddle1 : Paddle2;

        if (this.launch) {
            this.launchBall();
        }

        if (this.collision(player, this.nextPos) && this.LastCollision !== player) {
            this.LastCollision = player;
            this.LastHit = null;
        
            let collidePoint = (this.nextPos.y - (player.pos.y + player.height / 2));
            collidePoint = collidePoint / (player.height / 2);

            let angleRad = (Math.PI / 4) * collidePoint;
            let direction = (this.nextPos.x < canvas.width / 2) ? 1 : -1;
            this.velocity.x = direction * this.speed * Math.cos(angleRad);
            this.velocity.y = this.speed * Math.sin(angleRad);
        
            if (this.speed <= 0.95)
                this.speed += 0.04;
        } else {
            this.pos = this.nextPos;
        }
    
            if (this.pos.x <= 0 && this.goal == false) {
                this.goal = true;
                Paddle2.score++;
                this.left = true;
                ReDrawStatic = true;
                this.goal = false;
                this.resetBall();
    
            } else if (this.pos.x > canvas.width && this.goal == false) {
                this.goal = true;
                Paddle1.score++;
                this.left = false;
                ReDrawStatic = true;
                this.goal = false;
                this.resetBall();
            }
        }
        setVelocity(x){
            this.velocity.x *= x;
        }
    }

class PongPaddle {
    constructor(pos, keys) {
        this.pos = pos;
        this.velocity = 400;
        this.width = 10;
        this.height = 100;
        this.keys = keys;
        this.score = 0;
    }

    update(dt) {
        if (keysPressed[this.keys.up] && this.pos.y > 0) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y -= this.velocity * dt;
            
            if (this.pos.y < 0) {
                this.pos.y = 0;
            }
        }
        if (keysPressed[this.keys.down] && this.pos.y + this.height < 430) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y += this.velocity * dt;
            
            if (this.pos.y + this.height > 430) {
                this.pos.y = 430 - this.height;
            }
        }
    }
}


function Players() {
    Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
    
    if (!AI) {
        Paddle2 = null;
        Paddle1 = null;
        Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
        Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 10, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
    } else {
        Paddle2 = null;
        AIplayer = null;
        Paddle1 = null;
        Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 10, (canvas.height - 100) / 2), Bindings('F13', 'F14'));
        AIplayer = new AIPlayer();  
        Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
    }
}

//////////////////////////////////////////////
//////////////////DESSIN//////////////////////
//////////////////////////////////////////////




function drawStaticElements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#a2c11c";

    if (!RequestFrame && currentRound == 1) {
        ctx.fillRect(20, (canvas.height - 100) / 2, 10, 100);
        ctx.fillRect(canvas.width - 20 - 10, (canvas.height - 100) / 2, 10, 100);
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.fillText(0, canvas.width - 130, 50);
        ctx.fillText(0, 100, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.fillText("'↑': move up", canvas.width - 165, canvas.height - 30);
        ctx.fillText("'↓': move down", canvas.width - 165, canvas.height - 10);
        ctx.fillText("'w' : move up", 10, canvas.height - 30);
        ctx.fillText("'s' : move down", 10, canvas.height - 10);
    }
    else {
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.fillText(Paddle2.score, canvas.width - 130, 50);
        ctx.fillText(Paddle1.score, 100, 50);
        ReDrawStatic == false;
        }
}

function draw() {
    if (ReDrawStatic) {
        drawStaticElements();
    }

    ctx.clearRect(Ball.prevpos.x - Ball.radius, Ball.prevpos.y - Ball.radius, Ball.radius * 2, Ball.radius * 2);
    ctx.fillStyle = "#a2c11c";
    ctx.beginPath();
    ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    // AI DRAW RED BALL
    //if (AIplayer && AIplayer.prediction) {
    //ctx.beginPath();
    //ctx.arc(AIplayer.prediction.x, AIplayer.prediction.y, 5, 0, Math.PI * 2);
    //ctx.fillStyle = 'red';
    //ctx.fill();
    //}

    //Draw trails and other dynamic elements
    //for (let i = 0; i < Ball.trailPositions.length; i++) {
    //ctx.fillStyle = `rgba(255, 255, 255, ${Ball.trailOpacity * (i / Ball.trailLength)})`;
    //ctx.beginPath();
    //ctx.arc(Ball.trailPositions[i].x, Ball.trailPositions[i].y, Ball.radius, 0, Math.PI * 2);
    //ctx.fill();
    //}
}

//////////////////////////////////////////////////////////
//////////////////////GESTION TEMPS//////////////////////
/////////////////////////////////////////////////////////

export function onoffGame(Button){
    if (Button === 'off')
    {
        RequestFrame = false;
        clear();
        clearTourney();
        $("#aliasContainer").text('');
        RequestFrame = false;
        AI = false;
        title = true;
        EnterScreen();
    }
    if (Button === 'on')
    {
        clearTourney();
        clear();
        hideTourneyButtons();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $("#aliasContainer").text('');
        RequestFrame = false;
        AI = false;
        title = true;
        drawStaticElements();
        MenuButton.style.display = "none";
        EnterScreen();
    }
}
    
function GameLoop() {
    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    if (!RequestFrame)
        return;

    if (Paddle1.score === MAX_ROUNDS || Paddle2.score === MAX_ROUNDS) {
        console.log("Game Ending condition met");
        gameEnding = true;
        RequestFrame = false;
        if (!title)
            GameEndingScreen();
        title = false;
        return;
    }

    Ball.update(dt);
    Paddle1.update(dt);
    if (AI) {
        AIplayer.update(dt, Ball, Paddle2, Paddle1);
    }
    Paddle2.update(dt);
    draw();

    requestAnimationFrame(GameLoop);
}

function LaunchGame() {
    if (allButtonOk) {
        Players();
        draw();
        if (!RequestFrame && gameEnding) {
            gameEnding = false;
            clear();
        }
        if (!RequestFrame) {
            RequestFrame = true;
            requestAnimationFrame(GameLoop);
            allButtonOk = false;
        }
    }
}

function UpdateTourney() {
    $("#aliasContainer").text('');
    drawStaticElements();

    matches.forEach(match => {
        if (match.winner !== null && !match.final) {
            const matchElements = document.getElementsByClassName('match');
            Array.from(matchElements).forEach(matchElement => {
                const participants = matchElement.getElementsByClassName('participant');
                if ((participants[0].textContent === match.player1 || participants[1].textContent === match.player2) && 
                    !matchElement.classList.contains('final-match')) { // Ensure it's not the final match
                    if (match.winner !== match.player1 && match.player1 !== null) {
                        participants[0].style.backgroundColor = '#6d071a';
                    }
                    if (match.winner !== match.player2 && match.player2 !== null) {
                        participants[1].style.backgroundColor = '#6d071a';
                    }
                }
            });
        }
    });

    const semiFinalMatch1 = matches[0];
    const semiFinalMatch2 = matches[1];

    if (semiFinalMatch1 && semiFinalMatch2) {
        if (semiFinalMatch1.winner) {
            matches[matches.length - 1].player1 = semiFinalMatch1.winner;
            document.getElementById('winner1').innerHTML = semiFinalMatch1.winner;
        }
        if (semiFinalMatch2.winner) {
            matches[matches.length - 1].player2 = semiFinalMatch2.winner;
            document.getElementById('winner2').innerHTML = semiFinalMatch2.winner;
        }
    }

    if (matches[2].state == 1) {
        if (matches[2].winner == matches[2].player1)
            document.getElementById('winner2').style.backgroundColor = '#6d071a';
        else
            document.getElementById('winner1').style.backgroundColor = '#6d071a';
    }

    updateNextMatchButton();
    tournamentTree.style.display = 'inline-block';
}

function GameEndingScreen() {
    if (TourneyMode) {
        for (let i = 0; i < matches.length; i++) {
            if (matches[i].winner === null || matches[i].winner === undefined) {
                matches[i].winner = (Paddle1.score > Paddle2.score) ? matches[i].player1 : matches[i].player2;
                matches[i].state = 1;

                if (i == 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    UpdateTourney();

                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.font = '36px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle'; 

                    let winner = (Paddle1.score > Paddle2.score) ? matches[i].player1 : matches[i].player2;
                    ctx.fillText(`${winner} wins!`, canvas.width / 2, canvas.height / 2 - 145);
                    ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 2, canvas.height / 2 - 105);

                    ctx.restore();
                } else if (i == 1) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    UpdateTourney();

                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.font = '36px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle'; 

                    let winner = (Paddle1.score > Paddle2.score) ? matches[i].player1 : matches[i].player2;
                    ctx.fillText(`${winner} wins!`, canvas.width / 2, canvas.height / 2 - 145);
                    ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 2, canvas.height / 2 - 105);

                    ctx.restore();  
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    UpdateTourney();
                    if (matches[i].winner)
                    {
                        console.log("nouveau truc");
                        EndTourneyButton.style.display = 'inline-block';
                        ctx.save();
                        ctx.fillStyle = '#fff';
                        ctx.font = '36px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle'; 
    
                        let winner = (Paddle1.score > Paddle2.score) ? matches[i].player1 : matches[i].player2;
                        ctx.fillText(`${winner} wins the tourney!`, canvas.width / 2, canvas.height / 2 - 145);
                        ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 2, canvas.height / 2 - 105);
    
                        ctx.restore();  
                    }
                }
                break;
            }
        }
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; 
        giveName();

        let winner = (Paddle1.score > Paddle2.score) ? userInfo.username : player2Name;
        ctx.fillText(`${winner} wins!`, canvas.width / 2, canvas.height / 2 - 75);
        ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 2, canvas.height / 2 - 30);
        createMatch(Paddle1.score, Paddle2.score);

        ctx.restore();
        MenuChoice();
    }
}

//////////////////////////////////////////////
////////////////AI LOGIC/////////////////////
/////////////////////////////////////////////


class AIPlayer {
        constructor() {
            this.height = 100;
            this.prediction = {x: canvas.width / 2, y: canvas.height / 2};
            this.timeSinceLastPrediction = 0;
            this.move = false;
            this.predictionInterval = 1;
            this.paddleCenterY = 0;
            this.inRange = 50;
            this.paddleSeen = {x: canvas.width / 2, y: canvas.height / 2};
            this.BallSeen = {x: canvas.width / 2, y: canvas.height / 2} ;
            this.velocitySeen = {x: 0, y: 0};
        }

        update(dt, ball, Paddle2, Paddle1) {
            this.timeSinceLastPrediction += dt;

            if (this.timeSinceLastPrediction >= this.predictionInterval) {
                this.timeSinceLastPrediction = 0;
                this.paddleSeen = Paddle2.pos;
                this.BallSeen = Ball.pos;
                this.velocitySeen = Ball.velocity;
                this.paddleCenterY = Paddle2.pos.y + Paddle2.height / 2;
                this.predict(ball, dt, Paddle1);
                return;
            }


            if (this.prediction) {
                if (this.prediction.y >= this.paddleSeen.y + 25 && this.prediction.y <= this.paddleSeen.y + 100 - 25) {
                    this.stopMovingUp();
                    this.stopMovingDown();
                } else if (this.prediction.y < this.paddleCenterY  && this.paddleSeen.y > 0) {
                    this.stopMovingDown();
                    this.moveUp();
                } else if (this.prediction.y > this.paddleCenterY && this.paddleSeen.y + 50 < canvas.height) {
                    this.stopMovingUp();
                    this.moveDown();
                }
            }
        }

        collision(Paddle, pos) {
            let top = pos.y - Ball.radius;
            let bottom = pos.y + Ball.radius;
            let left = pos.x - Ball.radius;
            let right = pos.x + Ball.radius;
        
            return right > Paddle.pos.x &&
                   top < Paddle.pos.y + Paddle.height &&
                   left < Paddle.pos.x + Paddle.width &&
                   bottom > Paddle.pos.y;
        }

        predict(ball, dt, Paddle1) {
            let predictedPos = { x: ball.pos.x, y: ball.pos.y };
            let predictedVelocity = { x: ball.velocity.x, y: ball.velocity.y };
        
            while (true) {
                predictedPos.x += predictedVelocity.x * dt * 1000;
                predictedPos.y += predictedVelocity.y * dt * 1000;
        
                if (predictedPos.y - ball.radius < 0 || predictedPos.y + ball.radius > canvas.height) {
                    predictedVelocity.y *= -1;
                }
        
                if (this.collision(Paddle1, predictedPos)) {
                    let collidePoint = (predictedPos.y - (Paddle1.pos.y + Paddle1.height / 2));
                    collidePoint = collidePoint / (Paddle1.height / 2);
        
                    let angleRad = (Math.PI / 4) * collidePoint;
        
                    let direction = (predictedPos.x < canvas.width / 2) ? 1 : -1;
        
                    predictedVelocity.x = direction * ball.speed * Math.cos(angleRad);
                    predictedVelocity.y = ball.speed * Math.sin(angleRad);
                }
        
                if (predictedPos.x + ball.radius > canvas.width - 40) {
                    break;
                }

                if (predictedPos.x + ball.radius < 0) {
                    break;
                }
            }
        
            if (predictedVelocity.x <= 0) {
                this.prediction = { x: canvas.width / 2, y: canvas.height / 2 };
            } else {
                this.prediction = predictedPos;
            }
        }
          
        stopMovingUp() {
            simulateKeyPress("F13", "keyup");
        }

        stopMovingDown() {
            simulateKeyPress("F14", "keyup");
        }

        moveUp() {
            simulateKeyPress("F13", "keydown");
        }

        moveDown() {
            simulateKeyPress("F14", "keydown");
    }
}
////////////////////////////////////////////
//////////////////DATABASE/////////////////
///////////////////////////////////////////

const giveName = async () => {
    const response = await fetch('accounts/get-user-info/');
    const data = await response.json();
    if (data.username) {
        userInfo.username = data.username;
      } else {
        userInfo.username = 'anon';
      }
};

const checkAuthenticated = async () => {
    const response = await fetch('/accounts/check-authenticated/');
    const data = await response.json();
    console.log(data);
    return data.authenticated;
};

async function createMatch(user_score, alias_score) {
    const isAuthenticated = await checkAuthenticated();
    if (!isAuthenticated) {
    console.error("User not authenticated. Cannot create match.");
    return;
  }

  const response = await fetch('game/create-match/', {
    method: 'POST',
  });
  const data = await response.json();
  if (data.match_id) {
    console.log("Match created with ID:", data.match_id);
    sendScoreToDjango(user_score, alias_score, data.match_id);
  } else {
    console.error("Error creating match");
  }
}

function sendScoreToDjango(score, score2, match_id) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "game/save-score/", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        console.log("Score saved successfully.");
      } else {
        console.error("Failed to save score:", xhr.status, xhr.statusText);
      }
    }
  };
  xhr.send(JSON.stringify({ user_score: score, alias_score: score2, match_id: match_id }));
}