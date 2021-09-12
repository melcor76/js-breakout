const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');

// Calculate size of canvas from constants.
ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;

let x;
let y;
let requestId;
let dx;
let dy;

const paddleY = canvas.height - PADDLE.HEIGHT;
let paddleX = (canvas.width - PADDLE.WIDTH) / 2;
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
    x = canvas.width/2;
    y = canvas.height-30;
    dx = BALL.SPEED;
    dy = -BALL.SPEED;
}

function animate() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    detectCollission();
    update();
    if (y - BALL.RADIUS > canvas.height) {
        gameOver();
        return;
    }

    requestId = requestAnimationFrame(animate);
}

function update() {
    x += dx;
    y += dy;

    if(rightPressed) {
        paddleX += 7;
        if (paddleX + PADDLE.WIDTH > canvas.width){
            paddleX = canvas.width - PADDLE.WIDTH;
        }
    }
    else if(leftPressed) {
        paddleX -= 7;
        if (paddleX < 0){
            paddleX = 0;
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.fillStyle = "blue";
    ctx.arc(x, y, BALL.RADIUS, 0, Math.PI*2);
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, PADDLE.WIDTH, PADDLE.HEIGHT);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
}

function detectCollission() { 
    if (x + BALL.RADIUS > canvas.width || x - BALL.RADIUS < 0) {
      dx = -dx;
    }
          
    if (y - BALL.RADIUS < 0) {
      dy = -dy;
    }

    // Paddle
    if (y + BALL.RADIUS > canvas.height - PADDLE.HEIGHT && y + BALL.RADIUS < canvas.height) {
        if(x > paddleX && x < paddleX + PADDLE.WIDTH) {
            dy = -dy;
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

