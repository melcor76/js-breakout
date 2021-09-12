const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');

const paddle = {
    height: 10,
    width: 60,
    x: 0,
    y: 0
}
const ball = {
    x: 0,
    y: 0,
    speed: 5,
    radius: 10,
    dx: 0,
    dy: 0
}
const brick = {
    rows: 3,
    cols: 6,
}

let requestId;
let rightPressed = false;
let leftPressed = false;
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function play() {   
    init(); 
    if (requestId) {
        cancelAnimationFrame(requestId);
    }
    animate();
}

function init() {
    ball.x = canvas.width/2;
    ball.y = canvas.height-30;
    ball.dx = ball.speed;
    ball.dy = -ball.speed;
    paddle.x = canvas.width / 2;
    paddle.y = canvas.height - paddle.height;
}

function animate() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    detectCollission();
    update();
    if (ball.y - ball.radius > canvas.height) {
        gameOver();
        return;
    }

    requestId = requestAnimationFrame(animate);
}

function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if(rightPressed) {
        paddle.x += 7;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    }
    else if(leftPressed) {
        paddle.x -= 7;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.fillStyle = "blue";
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
}

function detectCollission() { 
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
    }
          
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    // Paddle
    if (ball.y + ball.radius > canvas.height - paddle.height && ball.y + ball.radius < canvas.height) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.dy = -ball.dy;
        }
    }
}

function keyDownHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function gameOver() {
    cancelAnimationFrame(requestId);
    console.log('GAME OVER');
}

