let socket = null;
const canvas = document.querySelector('canvas');
const onlineUI = document.getElementById("onlineChoiceUI");
const CreateRoom = document.getElementById("CreateRoom");
const JoinRoom = document.getElementById("joinRoom");
const roomNameInput = document.getElementById('roomName');
const start = document.getElementById('start');
const ctx = canvas.getContext("2d");
//const RPS = document.getElementById('gameUI');
let keysPressed = {};
let Paddle1 = null;
let Paddle2 = null;
let lastFrameTime = performance.now();
let RequestFrame = false;
let gameEnding = false;
let playerId = null;
let Ball = null;
var ReDrawStatic = true;
const MAX_ROUNDS = 3;
let currentRound = 1;
let emetteur = null;

setCanvasSize();
function setCanvasSize() {
    canvas.width = 860;
    canvas.height = 430; 
}


function OnlineGo() {
    socket = new WebSocket('wss://' + window.location.host + '/ws/pong/');

    socket.onopen = function(event) {
        console.log('Connected to the WebSocket server.');
    };

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };

    socket.onerror = function(error) {
        console.error('WebSocket Error: ', error);
    };

    socket.onclose = function(event) {
        console.log('WebSocket connection closed.');
    };
}

function sendBallPosition(ball_pos, ball_velocity) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'move_ball',
            'ball_pos': ball_pos,
            'ball_velocity': ball_velocity
        }));
    }
}

function updateBallPosition(ball_pos, ball_velocity) {
    if (Ball) {
        Ball.pos = ball_pos;
        Ball.velocity = ball_velocity;
        draw();
    }
}

function handleServerMessage(message) {
    console.log('Received message from server:', message);
    console.log('Current player ID:', playerId);

    if (message.message === 'Room created') {
        console.log('Room created successfully!');
        joinRoom();
    } else if (message.message === 'Joined room') {
        playerId = message.player_uuid;
        console.log('Joined the room successfully!');
    } else if (typeof message.message === 'string' && message.message.startsWith('Player')) {
        console.log('Player message:', message.message);
        if (message.player_uuid === playerId) {
            if (message.player_number === 2) {
                Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
                Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 10, (canvas.height - 100) / 2), Bindings('F15', 'F16'));
                // Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
                Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
                emetteur = true;
            } else if (message.player_number === 3) {
                Paddle1 = new PongPaddle(vec2(canvas.width - 20 - 10, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
                Paddle2 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('F15', 'F16'));
                Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
                emetteur = false;
            }
        }
    } else if (message.message === 'The game has started!') {
        console.log('The game is starting!');
        if (Paddle1 && Paddle2 && Ball) {
            GameLauncher();
        }
    } else if (message.command === 'move_paddle') {
        if (message.sender_uuid !== playerId) {
            updatePaddlePosition(message.paddle_pos);
        }
    }
    else if (message.command === 'move_ball') {
        updateBallPosition(message.ball_pos, message.ball_velocity);
    }
}


export function createRoom() {
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'create_room',
        'room_name': roomName
    }));
}

export function joinRoom() {
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'join_room',
        'room_name': roomName
    }));
}

export function startGame() {
    socket.send(JSON.stringify({
        'command': 'start_game'
    }));

}

CreateRoom.addEventListener("click", function() {
    CreateRoom.style.display = "none";
    JoinRoom.style.display = "none";
    roomNameInput.style.display = "none";
    createRoom();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

JoinRoom.addEventListener("click", function() {
    CreateRoom.style.display = "none";
    JoinRoom.style.display = "none";
    roomNameInput.style.display = "none";
    joinRoom();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

start.addEventListener("click", function() {
    startGame();
});

export function OnlineChoice(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onlineUI.style.display = "block";
    OnlineGo();
}

/// PONG PROTO ?? //

// PAS BESOIN DE REDISPATCH NORMALEMENT //

function vec2(x, y) {
    return { x: x, y: y };
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
        let moved = false;

        if (keysPressed[this.keys.up] && this.pos.y > 0) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y -= this.velocity * dt;
            if (this.pos.y < 0) {
                this.pos.y = 0;
            }
            moved = true;
        }
        if (keysPressed[this.keys.down] && this.pos.y + this.height < 430) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y += this.velocity * dt;
            if (this.pos.y + this.height > 430) {
                this.pos.y = 430 - this.height;
            }
            moved = true;
        }

        if (moved) {
            sendPaddlePosition(this.pos); 
        }
    }
}

function sendPaddlePosition(pos) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'move_paddle',
            'paddle_pos': pos
        }));
    }
}

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

    if (ReDrawStatic)
        drawStaticElements();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    ctx.fillStyle = "#a2c11c";
    ctx.beginPath();
    ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function GameLoop() {
    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    if (!RequestFrame)
        return;

    Paddle1.update(dt);
    Paddle2.update(dt);
    if (emetteur)
        Ball.update(dt);
    
    draw();

    requestAnimationFrame(GameLoop);
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
            sendBallPosition(this.pos, this.velocity);
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

function updatePaddlePosition(paddle_pos) {
    if (Paddle2) { 
        Paddle2.pos.y = paddle_pos.y;
        draw();
    }
}

function GameLauncher() {
        //Players();
        draw();
        if (!RequestFrame && gameEnding) {
            gameEnding = false;
            clear();
        }
        if (!RequestFrame) {
            RequestFrame = true;
            requestAnimationFrame(GameLoop);
            //allButtonOk = false;
        }
}