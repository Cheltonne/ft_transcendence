let socket = null;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");

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
    // Handle different types of messages here
}

export function createRoom() {
    const roomName = document.getElementById('roomName').value;
    socket.send(JSON.stringify({
        'command': 'create_room',
        'room_name': roomName
    }));
}

export function joinRoom(roomName) {
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


export function OnlineChoice(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    OnlineGo();
}