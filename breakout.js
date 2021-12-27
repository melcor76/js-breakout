const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

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
    x: canvas.width / 2,
    get y() { return canvas.height - this.height; }
}
let ball = {
    radius: 10
};
let brick = {
    matrix: [],
    rows: 5,
    cols: 10,
    get width() { return canvas.width / this.cols; },
    height: 30
}
let images = {
    ball: new Image(),
    paddle: new Image(),
    background: new Image()
}

images.ball.src = 'ball.webp';
images.paddle.src = 'paddle.webp';
images.background.src = 'bg-space.webp';

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
    paddle.speed = game.speed + 7;
}

function initBricks() {
    const topMargin = 30;
    const colors = ['red', 'orange', 'yellow', 'blue', 'green'];

    for(let c = 0; c < brick.cols; c++) {
        brick.matrix[c] = [];

        for(let r = 0; r < brick.rows; r++) {
            let x = c * brick.width;
            let y = r * brick.height + topMargin;
            brick.matrix[c][r] = { x, y, color: colors[r], hitsLeft: 1 };
        }
    }
}

function animate() { 
    draw();
    update();
    detectCollision();
    detectBrickCollision();
    checkLevel();

    // Check for lost ball
    if (ball.y - ball.radius > canvas.height) {
        game.lives -= 1;
        if (game.lives === 0) {
            gameOver();
            return;
        } else {
            initBall();
        }
    }

    game.requestId = requestAnimationFrame(animate);
}

function draw() {
    // clear canvas and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);

    // draw ball
    ctx.drawImage(images.ball, ball.x, ball.y, 2*ball.radius, 2*ball.radius);

    // draw paddle
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);

    drawBricks();
    drawScore();
    drawLives();
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

function drawBricks() {
    for (let row = 0; row < brick.rows; row++) {
        for(let col = 0; col < brick.cols; col++) {       
            let b = brick.matrix[col][row];
            if (b.hitsLeft) {            
                ctx.beginPath();
                ctx.fillStyle = b.color;
                ctx.rect(b.x, b.y, brick.width, brick.height);
                ctx.fill();
                ctx.strokeRect(b.x, b.y, brick.width, brick.height);
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = '16px Arial';
    ctx. fillStyle = 'white';
    const { level, score } = game;
    ctx.fillText(`Level: ${level}`, 5, 20);
    ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, 20);
}

function drawLives() {
    const { lives } = game;
    if (lives > 2) { ctx.drawImage(images.paddle, canvas.width - 150, 10, 40, 15); }
    if (lives > 1) { ctx.drawImage(images.paddle, canvas.width - 100, 10, 40, 15); }
    if (lives > 0) { ctx.drawImage(images.paddle, canvas.width - 50, 10, 40, 15); }
}

function detectCollision() {
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
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        game.rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        game.leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        game.rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        game.leftPressed = false;
    }
}

function gameOver() {
    cancelAnimationFrame(game.requestId);
    ctx.font = '40px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
}
