const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

let game = {
    requestId: null,
    leftKey: false,
    rightKey: false
}
let paddle = {
    height: 20,
    width: 100,
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
    background: new Image(),
    ball: new Image(),
    paddle: new Image()
}
images.background.src = './assets/bg-space.webp';
images.ball.src = './assets/ball.webp';
images.paddle.src = './assets/paddle.webp';

let brickField = [];

function play() {   
    resetGame();
    resetBall();
    resetPaddle();
    initBricks();

    if (game.requestId) {
        cancelAnimationFrame(game.requestId);
    }
    animate();
}

function resetGame() {
    game.speed = 8;
    game.score = 0;
    game.level = 1;
    game.lives = 3;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - paddle.height - 2 * ball.radius;
    ball.dx = game.speed * (Math.random() * 2 - 1);  // Random trajectory
    ball.dy = -game.speed; // Up
}

function resetPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.dx = game.speed + 7;
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
                points: (5 - r) * 2,
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
            resetBall();
            resetPaddle();
        }
    }

    game.requestId = requestAnimationFrame(animate);
}

function draw() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.ball, ball.x, ball.y, 2 * ball.radius, 2 * ball.radius);
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);
    drawBricks();
    drawScore();
    drawLives();
}

function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (game.rightKey) {
        paddle.x += paddle.dx;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    }
    if (game.leftKey) {
        paddle.x -= paddle.dx;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }
}

function checkLevel() {
    if (brickField.every((b) => b.hitsLeft === 0)) {
        game.level++;
        // speed++; should we increase speed?
        resetBall();
        resetPaddle();
        initBricks();
    }
}

function drawBricks() {
    brickField.forEach((b) => {
      if (b.hitsLeft) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, brick.width, brick.height);
        ctx.strokeRect(b.x, b.y, brick.width, brick.height);
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
        const ballCenterX = ball.x + ball.radius;
        return ball.y + 2 * ball.radius > canvas.height - paddle.height &&
               ball.y + ball.radius < canvas.height && 
               ballCenterX > paddle.x && ballCenterX < paddle.x + paddle.width;
      }
}

function detectBrickCollision() {
    let directionChanged = false;
    brickField.forEach((b) => {
        if (b.hitsLeft && 
            ball.x + 2 * ball.radius > b.x && 
            ball.x < b.x + brick.width && 
            ball.y + 2 * ball.radius > b.y && 
            ball.y < b.y + brick.height) {

                b.hitsLeft--;
                if (b.hitsLeft === 1) {
                    b.color = 'darkgray';
                }
                game.score += b.points;

                // console.log(`ball x: ${ball.x} y: ${ball.y}`)
                // console.log(`bric x: ${b.x} y: ${b.y}`)

                if (!directionChanged) {
                    directionChanged = true;
                    if (ball.x + 2* ball.radius - ball.dx <= b.x) { // Hit from left
                        ball.dx = -ball.dx;
                    } else if (ball.x - ball.dx >= b.x + brick.width) { // Hit from right
                        ball.dx = -ball.dx;
                    } else { // Hit from above or below
                        ball.dy = -ball.dy;
                    }
                }
        }
    });
}

function keyDownHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = false;
    }
}

function gameOver() {
    cancelAnimationFrame(game.requestId);
    ctx.font = '40px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
}
