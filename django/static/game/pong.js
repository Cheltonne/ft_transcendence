const canvas = document.querySelector('canvas');
const retryButton = document.getElementById('retryButton');
const ctx = canvas.getContext("2d");
const MAX_ROUNDS = 2;
var RequestFrame = false;
let currentRound = 1;
var ReDrawStatic = true;
var gameEnding = false;
let player2Name = 'random';
var allButtonOk = false;
var AI = false;
let Ball = null;
let Paddle1 = null;
let Paddle2 = null;
let GameStarted = false;
let lastFrameTime = performance.now();

////////////////////////////////////////////////////////
////////////////HTML CSS////////////////////////////////
////////////////////////////////////////////////////////
function vec2(x, y) {
    return { x: x, y: y };
}

function resizeCanvas() {
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const keysPressed = {};

document.addEventListener('keyup', function(event) {
    delete keysPressed[event.key];
});

function Bindings(upKey, downKey) {
    return { up: upKey, down: downKey };
}

document.addEventListener('keydown', function(event) {
    keysPressed[event.key] = true;
});

document.addEventListener("DOMContentLoaded", function() {
    var myButton = document.getElementById("myButton");
    var textInput = document.getElementById("textInput");
    var retryButton = document.getElementById("retryButton");
  
    myButton.addEventListener("click", function() {
        var alias = textInput.value.trim();
        if (alias != "") {
            player2Name = alias;
            myButton.style.display = "none";
            textInput.style.display = "none";
            //allButtonOk = true;
            ModeChoice();
            $("#aliasContainer").text(alias);
        } else {
            alert("Please enter your alias.");
        }
    });

    retryButton.style.display = "none";

    retryButton.addEventListener("click", function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Paddle1.score = 0;
        Paddle2.score = 0;
        RequestFrame = false;
        gameEnding = false;
        ReDrawStatic = true;
        allButtonOk = true;
        retryButton.style.display = "none";
        LaunchGame();
    });
});

function ModeChoice(){
    var Local = document.getElementById("LocalButton");
    var AIPlayer = document.getElementById("AIButton");

    Local.style.display = 'inline-block';
    AIPlayer.style.display = 'inline-block';

    Local.addEventListener("click", function() {
        allButtonOk = true;
        console.log("local");
        AI = false;
        Local.style.display = 'none';
        AIPlayer.style.display = 'none';
        LaunchGame();
    });
    AIPlayer.addEventListener("click", function() {
        allButtonOk = true;
        console.log("IA");
        AI = true;
        Local.style.display = 'none';
        AIPlayer.style.display = 'none';
        LaunchGame();
    });
}


  $(document).ready(function() {
    $("#myButton").click(function() {
        var alias = $("#textInput").val();
        if(alias.trim() === "") {
            alert("Please enter your alias.");
        } else {
            $("#aliasContainer").text(alias);
        }
    });
});


///////////////////////////////////////////////
//////////////PONG LOGIC///////////////////////
///////////////////////////////////////////////
class PongBall {
    constructor(pos) {
        this.pos = pos;
        this.velocity = vec2(0, 0);
        this.radius = 5;
        this.speed = 0.1;
        this.left = null;
        this.LastHit = null;
        this.trailLength = 10;
        this.trailOpacity = 0.1;
        this.trailPositions = [];
        this.goal = false;
        this.nextPos = false;
        this.launch = true;
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
            this.velocity = vec2(1, 1);
        else
            this.velocity = vec2(-1, -1);
        this.speed = 0.1;
        this.pos = vec2(canvas.width / 2, canvas.height / 2);
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
        return vec2(
            this.pos.x + this.velocity.x * dt * 1000,
            this.pos.y + this.velocity.y * dt * 1000
        );
    }

    launchBall() {
        this.goal = false;
        this.speed = 0.6;
        let direction = this.left ? 1 : -1;
        const randomNumber = Math.random() * Math.PI / 4;
        this.velocity.x = direction * this.speed * Math.cos(randomNumber);
        this.velocity.y = this.speed * Math.sin(randomNumber);
        this.launch = false;
    }

    update(deltaTime) {
        ctx.clearRect(this.pos.x - this.radius, this.pos.y - this.radius, this.radius * 2, null);
        this.nextPos = this.getNextPosition(deltaTime);
        this.CheckEdge(this.nextPos);

        let player = (this.pos.x < canvas.width / 2) ? Paddle1 : Paddle2;

        if (this.launch){
            this.launchBall();
        }
        if (this.collision(player, this.nextPos)) {
            this.LastHit = null;
            let collidePoint = (this.pos.y - (player.pos.y + player.height / 2));
                collidePoint = collidePoint / (player.height / 2);
                let angleRad = (Math.PI / 4) * collidePoint;
                let direction = (this.pos.x < canvas.width / 2) ? 1 : -1;
                this.velocity.x = direction * this.speed * Math.cos(angleRad);
                this.velocity.y = direction * this.speed * Math.sin(angleRad);
                if (this.speed <= 1)
                    this.speed += 0.02;
            } else {
                this.pos = this.nextPos;
            }
    
            if (this.pos.x <= 0 && this.goal == false) {
                this.goal = true;
                Paddle2.score++;
                console.log("goal 2");
                this.left = true;
                ReDrawStatic = true;
                this.resetBall();
                this.goal = false;
    
            } else if (this.pos.x >= canvas.width && this.goal == false) {
                this.goal = true;
                Paddle1.score++;
                console.log("goal 1");
                console.log(this.pos.x + " " + this.pos.y);
                this.left = false;
                ReDrawStatic = true;
                this.resetBall();
                this.goal = false;
            }
        }
        setVelocity(x){
            this.velocity.x *= x;
        }
    }

class PongPaddle {
    constructor(pos, keys) {
        this.pos = pos;
        this.velocity = 10;
        this.width = 10;
        this.height = 100;
        this.keys = keys;
        this.score = 0;
    }

    update() {
        if (keysPressed[this.keys.up] && this.pos.y > 0) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y -= this.velocity;
        }
        if (keysPressed[this.keys.down] && this.pos.y + this.height < canvas.height) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y += this.velocity;
        }
    }
}


function Players() {
    Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
    //Paddle1 = new PongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
    Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
    if (!AI){
        Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
    }
    else {
        Paddle2 = new AIPongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2))
    }   
}



function drawStaticElements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';

    if (!RequestFrame && currentRound == 1) {
        ctx.fillText('click on the canvas to begin',
            canvas.width / 3.5,
            canvas.height / 2 + 120
        );

        ctx.fillText('press 2 to play against AI',
            canvas.width / 3.5,
            canvas.height / 2 + 160
        );
    }

    ctx.fillText(Paddle2.score, canvas.width - 130, 50);
    ctx.fillText(Paddle1.score, 100, 50);
    ReDrawStatic == false;
}

function draw() {
    if (ReDrawStatic) {
        drawStaticElements();
    }

    ctx.fillStyle = "#a2c11c";
    ctx.beginPath();
    ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    if (Paddle2.prediction) {
    ctx.beginPath();
    ctx.arc(Paddle2.prediction.x, Paddle2.prediction.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    }

    //Draw trails and other dynamic elements
    for (let i = 0; i < Ball.trailPositions.length; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Ball.trailOpacity * (i / Ball.trailLength)})`;
    ctx.beginPath();
    ctx.arc(Ball.trailPositions[i].x, Ball.trailPositions[i].y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();
    }
}

function GameLoop() {
    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;

    Ball.update(dt);
    Paddle1.update();
    Paddle2.update(Ball, dt);
    draw();

    if (Paddle1.score === MAX_ROUNDS || Paddle2.score === MAX_ROUNDS) {
        console.log("Game Ending condition met");
        gameEnding = true;
        RequestFrame = false;
        GameEndingScreen();
        return;
    }

    requestAnimationFrame(GameLoop);
}

function GameEndingScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';

    let winner = (Paddle1.score > Paddle2.score) ? "Player 1" : player2Name;
    ctx.fillText(`${winner} wins!`, canvas.width / 5, canvas.height / 6 + 130);
    ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 5, canvas.height / 4 + 130);
    createMatch(Paddle1.score, Paddle2.score);

    retryButton.style.display = "inline-block";
}

function LaunchGame() {
    Players();
    if (allButtonOk) {
        console.log("Canvas clicked");
        draw();
        if (!RequestFrame && gameEnding) {
            GameEndingScreen();
            gameEnding = false;
            
        }
        if (!RequestFrame) {
            RequestFrame = true;
            requestAnimationFrame(GameLoop);
            allButtonOk = false;
        }
    }
}

//////////////////////////////////////////////
////////////////AI LOGIC/////////////////////
/////////////////////////////////////////////


class AIPongPaddle {
    constructor(pos) {
        this.pos = pos;
        this.velocity = 10; 
        this.width = 10;
        this.height = 100;
        this.score = 0;
        this.Mpredict = null;
        this.prediction = null;
        this.predictionCounter = 0;
        this.frameRate = 60;
        this.predictionFrequency = this.frameRate;
    }

    update(ball) {
        this.predictionCounter++;
        if (((ball.pos.x < this.pos.x) && (ball.velocity.x < 0)) ||
            ((ball.pos.x > this.pos.x + this.width) && (ball.velocity.x > 0))) {
            this.stopMovingUp();
            this.stopMovingDown();
            return;
        }

        
        if (this.predictionCounter >= this.predictionFrequency) {
            this.predict(ball);
            this.predictionCounter = 0;
        }

        if (this.prediction) {
            if (this.prediction.y < (this.pos.y + this.height / 2 - 5) && this.pos.y > 0) {
                this.stopMovingDown();
                this.moveUp();
            } else if (this.prediction.y > (this.pos.y + this.height / 2 + 5) && this.pos.y + this.height < canvas.height) {
                this.stopMovingUp();
                this.moveDown();
            } else {
                this.stopMovingUp();
                this.stopMovingDown();
            }
        }
    }

    predict(ball) {
        let predictedPos = { x: ball.pos.x, y: ball.pos.y };
        let predictedVelocity = { x: ball.velocity.x, y: ball.velocity.y };
    
        for (let i = 0; i < this.frameRate; i++) {
            predictedPos.x += predictedVelocity.x;
            predictedPos.y += predictedVelocity.y;
    
            if (predictedPos.y - ball.radius < 0 || predictedPos.y + ball.radius > canvas.height) {
                predictedVelocity.y *= -1;
            }
    
            if (predictedPos.x + ball.radius > canvas.width || predictedPos.x > this.pos.x) {
                break; 
            }
        }
    
        this.prediction = predictedPos;
    }

    stopMovingUp() {
        this.velocity = 0;
    }

    stopMovingDown() {
        this.velocity = 0;
    }

    moveUp() {
        this.velocity = 10; 
        ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
        this.pos.y -= this.velocity;
    }

    moveDown() {
        this.velocity = 10; 
        ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
        this.pos.y += this.velocity;
    }
}

////////////////////////////////////////////
//////////////////DATABASE/////////////////
///////////////////////////////////////////


const checkAuthenticated = async () => {
    const response = await fetch('/accounts/check-authenticated/');
    const data = await response.json();
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