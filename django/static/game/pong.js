const canvas = document.querySelector('canvas');
const retryButton = document.getElementById('retryButton');
const ctx = canvas.getContext("2d");
const MAX_ROUNDS = 2;
var RequestFrame = false;
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
let GameStarted = false;
let lastFrameTime = performance.now();

////////////////////////////////////////////////////////
////////////////HTML CSS////////////////////////////////
////////////////////////////////////////////////////////
setCanvasSize();
function setCanvasSize() {
    canvas.width = 860;  // 767 ?
    canvas.height = 430; 
}

//resizeCanvas();
//window.addEventListener('resize', resizeCanvas);

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
//////////////////BINDINGS/////////////////////
///////////////////////////////////////////////

const keysPressed = {};

function simulateKeyPress(key, type) {
    const event = new KeyboardEvent(type, { key });
    document.dispatchEvent(event);
}

function Bindings(upKey, downKey) {
    return { up: upKey, down: downKey };
}

/// simulateKeyPress("ArrowUp", "keydown"); // Simulate pressing the "ArrowUp" key
/// simulateKeyPress("ArrowDown", "keydown"); // Simulate pressing the "ArrowDown" key
/// simulateKeyPress("ArrowUp", "keyup"); // Simulate releasing the "ArrowUp" key

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
        this.radius = 5;
        this.speed = 0.3;
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
            this.pos = vec2(150, canvas.height / 2);
            }
        else
            {
            this.velocity = vec2(-1, -1);
            this.pos = vec2(canvas.width - 150, canvas.height / 2);
            }
            // je suis deile sa mere je resettais la alle dans la zone de goal
        this.resetSpeed();
        this.LastHit = null;
        this.launch = true;
        if (AI){
            simulateKeyPress("F13", "keyup");
            simulateKeyPress("F14", "keyup");
        }
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
            //this.goal = false;
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
        
            // Calculate the angle in radians
            let angleRad = (Math.PI / 4) * collidePoint;
        
            // Ensure the ball bounces correctly on top/bottom edges
            let direction = (this.nextPos.x < canvas.width / 2) ? 1 : -1;
        
            this.velocity.x = direction * this.speed * Math.cos(angleRad);
            this.velocity.y = this.speed * Math.sin(angleRad);
        
            //if (Math.abs(collidePoint) > 0.9) {
            //    this.velocity.y = -this.velocity.y;
            //}
            console.log(this.speed);
            if (this.speed <= 0.9)
                this.speed += 0.05;
        } else {
            this.pos = this.nextPos;
        }
    
            if (this.pos.x <= 0 && this.goal == false) {
                this.goal = true;
                Paddle2.score++;
                console.log("goal 2");
                this.left = true;
                ReDrawStatic = true;
                this.goal = false;
                this.resetBall();
    
            } else if (this.pos.x > canvas.width && this.goal == false) {
                this.goal = true;
                Paddle1.score++;
                console.log("goal 1");
                console.log(this.pos.x + " " + this.pos.y);
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
        }
        if (keysPressed[this.keys.down] && this.pos.y + this.height < canvas.height) {
            ctx.clearRect(this.pos.x, this.pos.y, this.width, this.height);
            this.pos.y += this.velocity * dt;
        }
    }
}


function Players() {
    Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
    //Paddle1 = new PongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
    Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
    if (!AI){
        Paddle2 = new PongPaddle(vec2(canvas.width - 40, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
    }
    else {
        Paddle2 = new PongPaddle(vec2(canvas.width - 40, (canvas.height - 100) / 2), Bindings('F13', 'F14'));
        AIplayer = new AIPlayer(vec2(canvas.width - 40, (canvas.height - 100) / 2))
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

    ctx.clearRect(Ball.prevpos.x - Ball.radius, Ball.prevpos.y - Ball.radius, Ball.radius * 2, Ball.radius * 2);
    ctx.fillStyle = "#a2c11c";
    ctx.beginPath();
    ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    if (AIplayer && AIplayer.prediction) {
    ctx.beginPath();
    ctx.arc(AIplayer.prediction.x, AIplayer.prediction.y, 5, 0, Math.PI * 2);
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
    Paddle1.update(dt);
    Paddle2.update(dt);
    if (AI) {
        AIplayer.update(dt, Ball, Paddle2, Paddle1);
    }
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

function GameEndingScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    giveName();

    let winner = (Paddle1.score > Paddle2.score) ? userInfo.username : player2Name;
    ctx.fillText(`${winner} wins!`, canvas.width / 5, canvas.height / 6 + 130);
    ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 5, canvas.height / 4 + 130);
    createMatch(Paddle1.score, Paddle2.score);

    retryButton.style.display = "inline-block";
}

//////////////////////////////////////////////
////////////////AI LOGIC/////////////////////
/////////////////////////////////////////////


class AIPlayer {
        constructor(pos) {
            this.pos = pos;
            this.height = 100;
            this.prediction = {x: canvas.width / 2, y: canvas.height / 2};
            //this.predictionV = { x: 0, y: 0 };
            this.timeSinceLastPrediction = 0;
            this.move = false;
            this.predictionInterval = 1;
            this.paddleCenterY = 0;
            this.inRange = 50;
        }

        update(dt, ball, Paddle2, Paddle1) {
            this.paddleCenterY = Paddle2.pos.y + Paddle2.height / 2;
            this.timeSinceLastPrediction += dt;

            if (this.timeSinceLastPrediction >= this.predictionInterval) {
                this.predict(ball, dt, Paddle1);
                this.timeSinceLastPrediction = 0;
                console.log("predicted");
                //this.move = true;
                return;
            }

            if ((this.prediction.y > Paddle2.pos.x + Paddle2.width) && (ball.velocity.x > 0)) {
            this.stopMovingUp();
            this.stopMovingDown();
            return;
        }

            if (this.prediction) {
                if (this.prediction.y >= Paddle2.pos.y + 25 && this.prediction.y <= Paddle2.pos.y + Paddle2.height - 25) {
                    this.stopMovingUp();
                    this.stopMovingDown();
                } else if (this.prediction.y < this.paddleCenterY  && Paddle2.pos.y > 0) {
                    this.stopMovingDown();
                    this.moveUp();
                } else if (this.prediction.y > this.paddleCenterY && Paddle2.pos.y + 50 < canvas.height) {
                    this.stopMovingUp();
                    this.moveDown();
                }
                console.log("Paddle2 position:", Paddle2.pos.x, Paddle2.pos.y);
                console.log("AIPlayer position:", AIplayer.pos.x, AIplayer.pos.y);
                //this.move = false;
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
        
            for (let i = 0; i < 500; i++) {
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
        
                    console.log("changed velocity");
                }
        
                if (predictedPos.x + ball.radius > canvas.width - 50) {
                    console.log(i);
                    break; 
                }
            }
            if (predictedVelocity.x <= 0)
                this.prediction = {x: canvas.width / 2, y: canvas.height / 2};
            else
                this.prediction = predictedPos;
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
    // je recup pas le pseudo du mec ici
    //player1name =  data.user_info('username');
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
    // je recup pas le pseudo du mec ici
    //player1name =  data.user_info('username');
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