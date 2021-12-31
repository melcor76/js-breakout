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
    height: 20,
    width: 100,
    x: canvas.width / 2,
    get y() { return canvas.height - this.height; }
}
let ball = {
    radius: 10
};
let brick = {
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

let brickField = [];

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
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 80;
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

    for(let r = 0; r < brick.rows; r++) {
        for(let c = 0; c < brick.cols; c++) {
            brickField.push({
                x: c * brick.width,
                y: r * brick.height + topMargin,
                color: colors[r],
                points: (5- r) * 2,
                hitsLeft: r === 0 ? 2 : 1
            });
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
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.ball, ball.x, ball.y, 2*ball.radius, 2*ball.radius);
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
    if (brickField.every((b) => b.hitsLeft === 0)) {
        game.level++;
        // speed++; should we increase speed?
        initBall();
        initBricks();
    }
}

function drawBricks() {
    brickField.forEach((b) => {
        if (b.hitsLeft) {         
            ctx.beginPath();
            ctx.fillStyle = b.color;
            ctx.rect(b.x, b.y, brick.width, brick.height);
            ctx.fill();
            ctx.strokeRect(b.x, b.y, brick.width, brick.height);
            ctx.closePath();
        }
    });
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
    if (hitLeftWall() || hitRightWall()) {
      ball.dx = -ball.dx;
    }          
    if (hitTop() || hitPaddle()) {
      ball.dy = -ball.dy;
    }
    if (hitPaddle()) {
        // TODO change this logic to angles with sin/cos
        // Change x depending on where on the paddle the ball bounces.
        // Bouncing ball more on one side drasw ball a little to that side.
        const drawingConst = 5
        const paddleMiddle = 2;
        const algo = (((ball.x - paddle.x) / paddle.width) * drawingConst);
        ball.dx = ball.dx + algo - paddleMiddle;
    }

    function hitTop() { return ball.y < 0 }
    function hitLeftWall() { return ball.x < 0 }
    function hitRightWall() { return ball.x + ball.radius * 2 > canvas.width }
    function hitPaddle() { 
        return ball.y + ball.radius * 2 > canvas.height - paddle.height &&
               ball.y + ball.radius < canvas.height && 
               ball.x > paddle.x && ball.x < paddle.x + paddle.width;
    }
    // TODO paddle collision needs improvement
}

function detectBrickCollision() {
    brickField.forEach((b) => {
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
                game.score += b.points;
        }
    });
}

function keyDownHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightPressed = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightPressed = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftPressed = false;
    }
}

function gameOver() {
    cancelAnimationFrame(game.requestId);
    ctx.font = '40px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
}
