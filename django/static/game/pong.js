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


const checkAuthenticated = async () => {
    const response = await fetch('/accounts/check-authenticated/');
    const data = await response.json();
    return data.authenticated;
};

function resizeCanvas() {
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const keysPressed = {};

document.addEventListener('keydown', function(event) {
    keysPressed[event.key] = true;
});

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the button when the DOM content is loaded
    var myButton = document.getElementById("myButton");
    var textInput = document.getElementById("textInput");
  
    myButton.addEventListener("click", function() {
        var alias = textInput.value.trim(); // Define alias here
        if (alias != "") {
            // Hide button and input field
            player2Name = alias;
            myButton.style.display = "none";
            textInput.style.display = "none";
            // Set up the game after entering the alias
            allButtonOk = true;
            setupRetryButton();
            // Show alias
            $("#aliasContainer").text(alias);
        } else {
            // If alias is empty, show an alert
            alert("Please enter your alias.");
        }
    });
});


retryButton.addEventListener("click", function() {
    console.log("Retry button clicked");

    // Reset game state
    Ball.resetBall();
    Paddle1.score = 0;
    Paddle2.score = 0;
    RequestFrame = true; // Restart game loop
    gameEnding = false;
    ReDrawStatic = true; // Redraw static elements
    allButtonOk = true; // Allow starting again

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Start game loop immediately after resetting
    requestAnimationFrame(GameLoop);
});

document.addEventListener("DOMContentLoaded", function() {
    // Call setupRetryButton here to set up event listener
    setupRetryButton();
});

function setupRetryButton() {
    // Add event listener to the retry button when the DOM content is loaded
    var retryButton = document.getElementById("retryButton");
    
    // Initially hide the retry button
    retryButton.style.display = "none";

    retryButton.addEventListener("click", function() {
        // Clear the canvas and restart the game
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        RequestFrame = true; // Restart game loop
        gameEnding = false;
        ReDrawStatic = true; // Redraw static elements
        allButtonOk = true; // Allow starting again
        retryButton.style.display = "none";
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

document.addEventListener('keyup', function(event) {
    delete keysPressed[event.key];
});

function Bindings(upKey, downKey) {
    return { up: upKey, down: downKey };
}

function vec2(x, y) {
    return { x: x, y: y };
}

class PongBall {
    constructor(pos) {
        this.pos = pos;
        this.velocity = vec2(8, 8);
        this.radius = 5;
        this.speed = 12;
        this.FirstCollision = false;
        this.left = null;
        this.LastHit = null;
        this.trailLength = 10;
        this.trailOpacity = 0.1;
        this.trailPositions = [];
        this.goal = false;
    }

    CheckEdge() {
        if (this.pos.y + this.radius > canvas.height && this.LastHit !== 1) {
            this.velocity.y *= -1;
            this.LastHit = 1;
        }
        if (this.pos.y - this.radius < 0 && this.LastHit !== 2) {
            this.velocity.y *= -1;
            this.LastHit = 2;
        }
    }

    resetBall() {
        if (this.left)
            this.velocity = vec2(8, 8);
        else
            this.velocity = vec2(-8, -8);
        this.speed = 12;
        this.pos = vec2(canvas.width / 2, canvas.height / 2);
        this.FirstCollision = false;
        this.LastHit = null;
    }

    collision(Paddle) {
        Paddle.Top = Paddle.pos.y;
        Paddle.Bottom = Paddle.pos.y + Paddle.height;
        Paddle.Left = Paddle.pos.x;
        Paddle.Right = Paddle.pos.x + Paddle.width;

        this.top = this.pos.y - this.radius;
        this.Bottom = this.pos.y + this.radius;
        this.left = this.pos.x - this.radius;
        this.right = this.pos.x + this.radius;

        return this.right > Paddle.Left && this.top < Paddle.Bottom && this.left < Paddle.Right && this.Bottom > Paddle.Top;
    }

    update() {
        this.pos.x += this.velocity.x;
        this.pos.y += this.velocity.y;
        this.CheckEdge();

        let player = (this.pos.x < canvas.width / 2) ? Paddle2 : Paddle1;

        if (this.collision(player)) {
            this.LastHit = null;
            let collidePoint = (this.pos.y - (player.pos.y + player.height / 2));
            collidePoint = collidePoint / (player.height / 2);
            let angleRad = (Math.PI / 4) * collidePoint;
            let direction = (this.pos.x < canvas.width / 2) ? 1 : -1;
            this.velocity.x = direction * this.speed * Math.cos(angleRad);
            this.velocity.y = direction * this.speed * Math.sin(angleRad);
            if (!this.FirstCollision) {
                this.speed += 4.0;
                this.FirstCollision = true;
            }
            else
                this.speed += 0.1;
        }

        if (this.pos.x <= 0 && this.goal == false) {
            this.goal = true;
            Paddle2.score++;
            this.left = true;
            ReDrawStatic = true;
            this.resetBall();
            if (Paddle1.score == 5)
            {
                gameEnding = true;
            }
            this.goal = false;

        } else if (this.pos.x >= canvas.width && this.goal == false) {
            this.goal = true;
            Paddle1.score++;
            this.left = false;
            ReDrawStatic = true;
            this.resetBall();
            if (Paddle2.score == 5)
            {
                gameEnding = true;
            }
            this.goal = false;

        }
    }

    setVelocity(x) {
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
            this.pos.y -= this.velocity;
        }
        if (keysPressed[this.keys.down] && this.pos.y + this.height < canvas.height) {
            this.pos.y += this.velocity;
        }
    }
}

let Ball = new PongBall(vec2(canvas.width / 2, canvas.height / 2));
let Paddle1 = new PongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));
let Paddle2 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));

function drawStaticElements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';

    if (!RequestFrame && currentRound == 1) {
        ctx.fillText('click on the canvas to begin',
            canvas.width / 3.5,
            canvas.height / 2 + 15
        );
    }

    //var player1X = canvas.width * 0.25 - ctx.measureText(player1Name).width / 2;
    //var player2X = canvas.width * 0.75 - ctx.measureText(player2Name).width / 2;
    //var y = 30;
  
    // Render player names
    //ctx.fillText(player1Name, player1X, y);
    //ctx.fillText(player2Name, player2X, y);

    ctx.fillText(Paddle2.score, canvas.width - 130, 50);
    ctx.fillText(Paddle1.score, 100, 50);
    ReDrawStatic == false;
}

function draw() {
    // Clear the canvas
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw static elements if needed
    if (ReDrawStatic) {
        drawStaticElements();
    }

    // Draw the ball
    ctx.fillStyle = "#a2c11c";
    ctx.beginPath();
    ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw the paddles
    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    //Draw trails and other dynamic elements
    //for (let i = 0; i < Ball.trailPositions.length; i++) {
    //  ctx.fillStyle = `rgba(255, 255, 255, ${Ball.trailOpacity * (i / Ball.trailLength)})`;
    //   ctx.beginPath();
    //   ctx.arc(Ball.trailPositions[i].x, Ball.trailPositions[i].y, Ball.radius, 0, Math.PI * 2);
     //  ctx.fill();
    //}
}

function GameLoop(timestamp) {
    if (RequestFrame) {
        Ball.update();
        Paddle1.update();
        Paddle2.update();
        draw();
       /* 
        console.log("Player 1 score:", Paddle1.score);
        console.log("Player 2 score:", Paddle2.score);
        */
        if (Paddle1.score == MAX_ROUNDS || Paddle2.score == MAX_ROUNDS) {
            console.log("Game Ending condition met");
           
            RequestFrame = false;   
            GameEndingScreen();
            return;
        }
            // requestAnimationFrame(GameLoop);

            setTimeout(() => {
                requestAnimationFrame(GameLoop);
            }, 14);
    }
}

function GameEndingScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';

    let winner = (Paddle1.score > Paddle2.score) ? "Player 1" : player2Name;
    ctx.fillText(`${winner} wins!`, canvas.width / 5, canvas.height / 6 + 130);
    ctx.fillText(`${Paddle1.score} - ${Paddle2.score}`, canvas.width / 5, canvas.height / 4 + 130);
    createMatch(Paddle1.score, Paddle2.score);

    // Show the retry button
    retryButton.style.display = "inline-block";

    // Request animation frame to restart the game loop
    //requestAnimationFrame(GameLoop);
}


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

draw();
canvas.onclick = () => {
    if (allButtonOk) {
        console.log("Canvas clicked");
        if (!RequestFrame && gameEnding) {
            GameEndingScreen();
            gameEnding = false;
            //allButtonOk = false;
            // ajoute un Bouton retry pour relancer
            
        }
        if (!RequestFrame) {
            RequestFrame = true;
            requestAnimationFrame(GameLoop);
            allButtonOk = false;
        }
    }
};