
/*

let socket = null;
const canvas = document.querySelector('canvas');
const onlineUI = document.getElementById("onlineChoiceUI");
const CreateRoom = document.getElementById("CreateRoom");
const JoinRoom = document.getElementById("joinRoom");
const roomNameInput = document.getElementById('roomName');
const start = document.getElementById('start');
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
let emetteur = false;
let drawFakeBall = false;
var userInfo = {username: 'player1'};
let player2Name = 'player2';
//import { createMatch, sendScoreToDjango } from './online.js';
import { MenuChoice, checkAuthenticated } from "./pong.js";
import { ctx } from "./pong.js";

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

export function StartButtonRoom() {
    socket.send(JSON.stringify({
        'command': 'start_button',
    }));
}

function DisplayStartButton(){
    start.style.display = "inline-block";
}

export function createRoom() {
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'create_room',
        'room_name': roomName
    }));
}

export function joinRoom() {
    UpdateUserName();
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'join_room',
        'room_name': roomName
    }));
}

export function startGame() {
    drawStaticElements();
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
    drawStaticElements();
});

start.addEventListener("click", function() {
    startGame();
});

export function OnlineChoice(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    CreateRoom.style.display = 'inline-block';
    JoinRoom.style.display = 'inline-block';
    roomNameInput.style.display = 'inline-block';
    //start.style.display = "inline-block";
    onlineUI.style.display = "block";
    OnlineGo();
}

export function sendPaddlePosition(pos) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'move_paddle',
            'paddle_pos': pos
        }));
    }
}


export function sendScoreUpdate(score1, score2) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'update_score',
            'score1': score1,
            'score2': score2,
            'player_uuid': playerId // Send the player's UUID
        }));
    }
}

let socket = null;
const canvas = document.querySelector('canvas');
const onlineUI = document.getElementById("onlineChoiceUI");
const CreateRoom = document.getElementById("CreateRoom");
const JoinRoom = document.getElementById("joinRoom");
const roomNameInput = document.getElementById('roomName');
const start = document.getElementById('start');
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
let emetteur = false;
let drawFakeBall = false;
var userInfo = {username: 'player1'};
let player2Name = 'player2';
//import { createMatch, sendScoreToDjango } from './online.js';
import { MenuChoice, checkAuthenticated } from "./pong.js";
import { ctx } from "./pong.js";

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

export function StartButtonRoom() {
    socket.send(JSON.stringify({
        'command': 'start_button',
    }));
}

function DisplayStartButton(){
    start.style.display = "inline-block";
}

export function createRoom() {
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'create_room',
        'room_name': roomName
    }));
}

export function joinRoom() {
    UpdateUserName();
    const roomName = roomNameInput.value;
    socket.send(JSON.stringify({
        'command': 'join_room',
        'room_name': roomName
    }));
}

export function startGame() {
    drawStaticElements();
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
    drawStaticElements();
});

start.addEventListener("click", function() {
    startGame();
});

export function OnlineChoice(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    CreateRoom.style.display = 'inline-block';
    JoinRoom.style.display = 'inline-block';
    roomNameInput.style.display = 'inline-block';
    //start.style.display = "inline-block";
    onlineUI.style.display = "block";
    OnlineGo();
}

export function sendPaddlePosition(pos) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'move_paddle',
            'paddle_pos': pos
        }));
    }
}


export function sendScoreUpdate(score1, score2) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'command': 'update_score',
            'score1': score1,
            'score2': score2,
            'player_uuid': playerId // Send the player's UUID
        }));
    }
}
    */