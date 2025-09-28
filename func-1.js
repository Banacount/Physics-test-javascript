
const gameCan1 = document.getElementById('game-1');
const shape = gameCan1.getContext('2d');
const balls = []

//Objects
class Vector{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    add(vec){
        return new Vector(this.x + vec.x, this.y + vec.y);
    }
    subtract(vec){
        return new Vector(this.x - vec.x, this.y - vec.y);
    }
    multi(vec){
        return new Vector(this.x * vec.x, this.y * vec.y);
    }
    multiply(num){
        return new Vector(this.x * num, this.y * num);
    }
    mag(){
        return Math.sqrt(this.x**2 + this.y**2);
    }
    unit(){
        if(this.mag() === 0){
            return new Vector(0, 0);
        } else {
            return new Vector(this.x/this.mag(), this.y/this.mag());
        }
    }
    dist(other){
        return this.subtract(other).mag();
    }
    static dot(p1, p2){
        return (p1.x * p2.x) + (p1.y * p2.y);
    }

    drawPos(xpos, ypos, m, color){
        shape.beginPath(); shape.moveTo(xpos, ypos); shape.lineTo(xpos+this.x*m, ypos+this.y*m);
        shape.strokeStyle = color; shape.stroke();
        shape.closePath();
    }

}

class Ball{
    constructor(x, y, r){
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.acceleration = 1;
        this.radius = r;
        this.canControl = false;
        this.static = false;
        this.theImage = null;
        balls.push(this);
    }

    draw(){
        if(this.theImage != null){ shape.save(); }
        shape.beginPath();
        shape.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        shape.stroke();
        shape.fillStyle = "red";
        shape.fill();
        if(this.theImage != null){
            shape.closePath();
            shape.clip();
            shape.drawImage(this.theImage, this.pos.x - this.radius, this.pos.y - this.radius,
                this.radius*2, this.radius*2
            );
            shape.restore();
        }
    }

    inCollision(other){
        let distance = accRound(this.pos.dist(other.pos), 3);
        let collideRange = this.radius + other.radius;
        if(distance < collideRange){
            //Change the "<"" above to "<=" replicate the hook thing. 
            return true;
        } else {
            return false;
        }
    }
    penetrationDepth(other){
        let total_r = other.radius + this.radius;
        let pos_sum = this.pos.dist(other.pos);
        return accRound(total_r - pos_sum, 3);
    }

    repos(){
        this.acc = this.acc.unit().multiply(this.acceleration);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.multiply(1-friction);
        this.pos = this.pos.add(this.vel);
    }
    displayVectorLines(){
        //Velocity line
        this.vel.drawPos(this.pos.x, this.pos.y, 8, "blue");
        //Acceleration line
    }
}

const image1 = new Image();
const image2 = new Image();
image1.src = './bruh.png';
image2.src = './yer.png';
let mainBall = new Ball(100, 100, 30);
let ball4 = new Ball(300, 400, 30);
let ball2 = new Ball(100, 200, 40);
let ball3 = new Ball(100, 300, 25);
ball2.static = true;
ball2.theImage = image1;
ball4.theImage = image2;
mainBall.acceleration = 0.4;

//Variables
let xtest = 0;
let ytest = 0;
let friction = 0.1;
let controlSetDone = false;
let up, down, left, right;

//Functions
function accRound(num, precision){
    let fac = 10**precision;
    let numT = fac * num;
    return Math.round(numT) / fac;
}
//Penetration responses
function pen_res_only(ba1, ba2){
    let sub_dist = ba1.pos.subtract(ba2.pos);
    let pen_depth = ba1.penetrationDepth(ba2);
    let pen_res = sub_dist.unit().multiply(pen_depth/2);
    ba1.pos = ba1.pos.add(pen_res);
}
function pen_res(ba1, ba2){
    let sub_dist = ba1.pos.subtract(ba2.pos);
    let pen_depth = ba1.penetrationDepth(ba2);
    let pen_res = sub_dist.unit().multiply(pen_depth/2);
    ba1.pos = ba1.pos.add(pen_res);
    ba2.pos = ba2.pos.add(pen_res.multiply(-1));
}
//Colision Response
function collideResponse(ball1, ball2){
    let normal = ball1.pos.subtract(ball2.pos).unit();
    let relative_vel = ball1.vel.subtract(ball2.vel);
    let separate_vel = Vector.dot(relative_vel, normal);
    let new_sep = -separate_vel;
    let separate_vector = normal.multiply(new_sep);
    ball1.vel = ball1.vel.add(separate_vector);
    ball2.vel = ball2.vel.add(separate_vector).multiply(-1);
}
function collideResponse_only(ball1, ball2){
    let normal = ball1.pos.subtract(ball2.pos).unit();
    let relative_vel = ball1.vel.subtract(ball2.vel);
    let separate_vel = Vector.dot(relative_vel, normal);
    let new_sep = -separate_vel;
    let separate_vector = normal.multiply(new_sep);
    ball1.vel = ball1.vel.add(separate_vector);
}
//Box limiter
function wall_test(ballObj, x_limit, y_limit){
    let xLimit = x_limit - ballObj.radius;
    let yLimit = y_limit - ballObj.radius;
    let Limit0 = 0 + ballObj.radius;
    //X limits
    if(ballObj.pos.x > xLimit){ let pen_depth = accRound(ballObj.pos.x - xLimit, 3); ballObj.pos.x = ballObj.pos.x - pen_depth; }
    if(ballObj.pos.x < Limit0){ let pen_depth = accRound(ballObj.pos.x - Limit0, 3); ballObj.pos.x = ballObj.pos.x - pen_depth; }
    //Y limits
    if(ballObj.pos.y > yLimit){ let pen_depth = accRound(ballObj.pos.y - yLimit, 3); ballObj.pos.y = ballObj.pos.y - pen_depth; }
    if(ballObj.pos.y < Limit0){ let pen_depth = accRound(ballObj.pos.y - Limit0, 3); ballObj.pos.y = ballObj.pos.y - pen_depth; }
}
function ballMastery(ball){
    let accel = ball.acceleration;
    if(!controlSetDone){
        gameCan1.addEventListener('keydown', (e) => {
            if(e.code == 'ArrowUp'){ up = true; }
            if(e.code == 'ArrowDown'){ down = true; }
            if(e.code == 'ArrowRight'){ right = true; }
            if(e.code == 'ArrowLeft'){ left = true; }
        });
        gameCan1.addEventListener('keyup', (e) => {
            if(e.code == 'ArrowUp'){ up = false; }
            if(e.code == 'ArrowDown'){ down = false; }
            if(e.code == 'ArrowRight'){ right = false; }
            if(e.code == 'ArrowLeft'){ left = false; }
        });
        controlSetDone = true;
    }

    if(up){ ball.acc.y = -accel; }
    if(down){ ball.acc.y = +accel; }
    if(right){ ball.acc.x = +accel; }
    if(left){ ball.acc.x = -accel; }
    //Stop the ball from moving
    if(!up && !down){ ball.acc.y = 0; }
    if(!right && !left){ ball.acc.x = 0; }

    ball.acc = ball.acc.unit().multiply(accel);
    ball.vel = ball.vel.add(ball.acc);
    ball.vel = ball.vel.multiply(1-friction);
    ball.pos = ball.pos.add(ball.vel);
}

mainBall.canControl = true;
//Loops a whole lottta bruh
function repeats(){
    shape.clearRect(0, 0, gameCan1.clientWidth, gameCan1.clientHeight);
    balls.forEach((ball, ind1) => {
        ball.draw();
        if(ball.canControl){
            ballMastery(ball);
        }
        ball.displayVectorLines();
        ball.repos();
        wall_test(ball, gameCan1.clientWidth, gameCan1.clientHeight);
        for(let i = ind1+1; i < balls.length; i++){
            let ballA = ball;
            let ballB = balls[i];
            if(ballA.inCollision(ballB)){
                if(ballA.static && !ballB.static){
                    pen_res_only(ballB, ballA);
                    collideResponse_only(ballB, ballA);
                } else if(!ballA.static && ballB.static){
                    pen_res_only(ballA, ballB);
                    collideResponse_only(ballA, ballB);
                } else {
                    pen_res(ballA, ballB);
                    collideResponse(ballA, ballB);
                }
            }
        }
    });
    requestAnimationFrame(repeats);
}
requestAnimationFrame(repeats);

setInterval(() => {
    let test1 = accRound(mainBall.pos.dist(ball2.pos), 3);
    let isCol = mainBall.inCollision(ball2);

    console.log("Penetration: "+mainBall.penetrationDepth(ball2));
    console.log(test1);
    console.log(isCol);
}, 10000);