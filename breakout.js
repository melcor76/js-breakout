const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let game = {
    speed: 1,
    score: 0,
    level: 1,
    requestId: null,
    leftPressed: false,
    rightPressed: false
}
let paddle = {
    height: 23,
    width: 114,
}
let ball = {
    radius: 10
};
let brick = {
    matrix: [],
    rows: 5,
    cols: 7,
    width: 90,
    height: 30,
    margin: 20,
}
let images = {
    ball: new Image(),
    paddle: new Image(),
    background: new Image()
}

images.ball.src = 'ball.webp';
images.ball.width = 2* ball.radius;
images.ball.height = 2*  ball.radius;

images.paddle.src = 'paddle.webp';
images.paddle.width = paddle.width;
images.paddle.height = paddle.height;

images.background.src = 'bg-space.webp';
images.background.width = canvas.width;
images.background.height = canvas.height;

function play() {   
    initGame();
    initBall();
    initPaddle();
    initBricks();

    if (game.requestId) {
        cancelAnimationFrame(game.requestId);
    }
    animate();
}

function initGame() {
    game.speed = 8;
    game.score = 0;
    game.level = 1;
    game.lives = 3;
}

function initBall() {
    ball.x = canvas.width/2;
    ball.y = canvas.height-80;
    ball.dx = game.speed;  // Right
    ball.dy = -game.speed; // Up
}

function initPaddle() {
    paddle.x = canvas.width / 2;
    paddle.y = canvas.height - paddle.height;
    paddle.speed = game.speed + 7;
}

function initBricks() {
    const wallMargin = 20;
    const roofMargin = 30;
    const colors = ['red', 'blue', 'yellow', 'green', 'orange'];
    for(let c = 0; c < brick.cols; c++) {
        brick.matrix[c] = [];
        for(let r = 0; r < brick.rows; r++) {
            let x = c * (brick.width + brick.margin) + wallMargin;
            let y = r * (brick.height + brick.margin) + roofMargin;
            brick.matrix[c][r] = { x, y, color: colors[r], hitsLeft: 1 };
        }
    }
}

function animate() { 
    draw();
    update();
    detectCollission();
    detectBrickCollision();
    checkLevel();

    // Check for lost ball
    if (ball.y - ball.radius > canvas.height) {
        game.lives -= 1;
        if (game.lives === 0) {
            drawScore()
            gameOver();
            return;
        } else {
            initBall();
        }
    }

    game.requestId = requestAnimationFrame(animate);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();
}

function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (game.rightPressed) {
        paddle.x += paddle.speed;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    } else if (game.leftPressed) {
        paddle.x -= paddle.speed;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }
}

function checkLevel() {
    if (brick.matrix.every(b => b.every((b) => b.hitsLeft === 0))) {
        game.level++;
        // speed++; should we increase speed?
        initBall();
        initBricks();
    }
}

function drawBall() {
    ctx.drawImage(images.ball, ball.x, ball.y, 2*ball.radius, 2*ball.radius);
}

function drawPaddle() {
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBricks() {
    for (let row = 0; row < brick.rows; row++) {
        for(let col = 0; col < brick.cols; col++) {       
            let b = brick.matrix[col][row];
            if (b.hitsLeft) {            
                ctx.beginPath();
                ctx.fillStyle = b.color;
                ctx.rect(b.x, b.y, brick.width, brick.height);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
  ctx.font = "14px Arial";
  ctx. fillStyle = "white";
  const { level, score, lives } = game;
  ctx.fillText(`Level: ${level} Score: ${score} Lives: ${lives}`, 5, 20);
}

function detectCollission() {
    if (ball.x + ball.radius * 2 > canvas.width || ball.x < 0) {
      ball.dx = -ball.dx;
    }
          
    if (ball.y < 0) {
      ball.dy = -ball.dy;
    }

    // Paddle
    if (ball.y + ball.radius * 2 > canvas.height - paddle.height && ball.y + ball.radius < canvas.height) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.dy = -ball.dy;

            // Change x depending on where on the paddle the ball bounces.
            // Bouncing ball more on one side drasw ball a little to that side.
            const drawingConst = 5
            const paddleMiddle = 2;
            const algo = (((ball.x - paddle.x) / paddle.width) * drawingConst);
            ball.dx = ball.dx + algo - paddleMiddle;
        }
    }
}

function detectBrickCollision() {
    for(let c = 0; c < brick.cols; c++) {
        for(let r = 0; r < brick.rows; r++) {
            let b = brick.matrix[c][r];
            
            if (b.hitsLeft && 
                ball.x + ball.radius * 2 > b.x && 
                ball.x < b.x + brick.width && 
                ball.y + ball.radius * 2 > b.y && 
                ball.y < b.y + brick.height) {

                    // console.log(`ball x: ${ball.x} y: ${ball.y}`)
                    // console.log(`bric x: ${b.x} y: ${b.y}`)

                    if (ball.x + ball.radius <= b.x) { // Hit from left
                        ball.dx = -ball.dx;
                    } else if (ball.x + ball.radius >= b.x + brick.width) { // Hit from let
                        ball.dx = -ball.dx;
                    } else { // Hit from above or below
                        ball.dy = -ball.dy;
                    }
                                      
                    b.hitsLeft--;
                    game.score += (5 - r) * 2;
            }
        }
    }
}

function keyDownHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        game.rightPressed = true;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        game.leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        game.rightPressed = false;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        game.leftPressed = false;
    }
}

function gameOver() {
    cancelAnimationFrame(game.requestId);
    console.log('GAME OVER');
}

