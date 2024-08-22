let socket = null;
const canvas = document.querySelector('canvas');
const onlineUI = document.getElementById("onlineChoiceUI");
const CreateRoom = document.getElementById("CreateRoom");
const JoinRoom = document.getElementById("joinRoom");
const roomNameInput = document.getElementById('roomName');
const start = document.getElementById('start');
const ctx = canvas.getContext("2d");
const RPS = document.getElementById('gameUI');
let keysPressed = {};

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

function handleServerMessage(message) {
    console.log('Received message from server:', message);
    if (message.message === 'Room created') {
        console.log('Room created successfully!');
        joinRoom();
    } else if (message.message === 'Joined room') {
        console.log('Joined the room successfully!');
    } else if (message.message.includes('Player')) {
        console.log(message.message);
    } else if (message.message === 'The game has started!') {
        console.log('The game is starting!');
        // Initiate game logic here
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

    Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
    Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 10, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
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
    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);
}


function GameLoop() {
    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    if (!RequestFrame)
        return;

    Paddle1.update(dt);
    Paddle2.update(dt);
    draw();

    requestAnimationFrame(GameLoop);
}