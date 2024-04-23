const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");
const MAX_ROUNDS = 3;
var RequestFrame = false;
let currentRound = 1;
var ReDrawStatic = true;

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

        let player = (this.pos.x < canvas.width / 2) ? Paddle1 : Paddle2;

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

        if (this.pos.x <= 0) {
            Paddle1.score++;
            this.left = true;
            this.resetBall();
            RequestFrame = false;

        } else if (this.pos.x >= canvas.width) {
            Paddle2.score++;
            this.left = false;
            this.resetBall();
            RequestFrame = false;
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
let Paddle1 = new PongPaddle(vec2(20, (canvas.height - 100) / 2), Bindings('w', 's'));
let Paddle2 = new PongPaddle(vec2(canvas.width - 20 - 20, (canvas.height - 100) / 2), Bindings('ArrowUp', 'ArrowDown'));

function drawStaticElements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';

    if (!RequestFrame && currentRound == 1) {
        ctx.fillText('Press any key to begin',
            canvas.width / 3.5,
            canvas.height / 2 + 15
        );
    }
    
    ctx.fillText(Paddle1.score, 100, 50);
    ctx.fillText(Paddle2.score, canvas.width - 130, 50);
    ReDrawStatic == false;
}

function draw() {
    if (ReDrawStatic){
        drawStaticElements();
    }
    
    ctx.fillStyle = "#a2c11c";
    ctx.fillRect(Paddle1.pos.x, Paddle1.pos.y, Paddle1.width, Paddle1.height);
    ctx.fillRect(Paddle2.pos.x, Paddle2.pos.y, Paddle2.width, Paddle2.height);

    if (RequestFrame) {
        ctx.beginPath();
        ctx.arc(Ball.pos.x, Ball.pos.y, Ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = 0; i < Ball.trailPositions.length; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Ball.trailOpacity * (i / Ball.trailLength)})`;
        ctx.beginPath();
        ctx.arc(Ball.trailPositions[i].x, Ball.trailPositions[i].y, Ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function GameLoop(timestamp) {
    if (RequestFrame) {
        Ball.update();
        Paddle1.update();
        Paddle2.update();
        draw();
        requestAnimationFrame(GameLoop);
    }
}

draw();
canvas.onclick = () => {
    if (!RequestFrame) {
        RequestFrame = true;
        GameLoop();
    }
};