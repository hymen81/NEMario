(function () {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	function setZeroTimeout(fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				var fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener("message", handleMessage, true);

	window.setZeroTimeout = setZeroTimeout;
})();

var Neuvol;
var game;
var FPS = 60;
var maxScore = 0;

var images = {};

var speed = function (fps) {
	FPS = parseInt(fps);
}

var loadImages = function (sources, callback) {
	var nb = 0;
	var loaded = 0;
	var imgs = {};
	for (var i in sources) {
		nb++;
		imgs[i] = new Image();
		imgs[i].src = sources[i];
		imgs[i].onload = function () {
			loaded++;
			if (loaded == nb) {
				callback(imgs);
			}
		}
	}
}

var Bird = function (json) {
	this.x = 10;
	this.y = 500;
	this.width = 16;
	this.height = 16;

	this.alive = true;
	this.gravity = 0;
	this.velocity = 0.3;
	this.jump = -9;

	this.stopCount = 0;

	this.isVisible = true;

	this.init(json);
}

Bird.prototype.init = function (json) {
	for (var i in json) {
		this[i] = json[i];
	}
}

Bird.prototype.flap = function () {
	if (this.y == 512 - this.height)
		this.gravity = this.jump;
}

Bird.prototype.update = function () {
	this.gravity += this.velocity;
	this.y += this.gravity;
	if (this.y >= 512 - this.height) this.y = 512 - this.height;
}

Bird.prototype.isDead = function (height, pipes) {
	if (/*this.y >= height ||*/ this.y + this.height <= 0) {
		return true;
	}
	for (var i in pipes) {
		if (!(
			this.x > pipes[i].x + pipes[i].width ||
			this.x + this.width < pipes[i].x ||
			this.y > pipes[i].y + pipes[i].height ||
			this.y + this.height < pipes[i].y
		)) {
			return true;
		}
	}
}

var Pipe = function (json) {
	this.x = 0;
	this.y = 0;
	this.width = 50;
	this.height = 40;
	this.speed = 0;
	this.type = 'pipe'

	this.init(json);
}

Pipe.prototype.init = function (json) {
	for (var i in json) {
		this[i] = json[i];
	}
}

Pipe.prototype.update = function () {
	this.x -= this.speed;
}

Pipe.prototype.isOut = function () {
	if (this.x + this.width < 0) {
		return true;
	}
}

var Game = function () {
	this.pipes = [];
	this.birds = [];
	this.preBirds = [];
	this.score = 0;
	this.canvas = document.querySelector("#flappy");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.spawnInterval = 90;
	this.interval = 0;
	this.gen = [];
	this.alives = 0;
	this.generation = 0;
	this.backgroundSpeed = 0.5;
	this.backgroundx = 0;
	this.maxScore = 0;

	for (var i = 0; i < 5; i++) {
		var dis = Math.round(Math.random() * 100 + 200);
		
		if(i == 3)
			this.pipes.push(new Pipe({  x: i * dis + 100, y: 510/*+pipeHoll*/, height: 512, type: 'nonePipe' }));
			else
			this.pipes.push(new Pipe({ x: i * dis + 100, y:450+(Math.random()*40-20), height: 512 }));
	}

	
}

Game.prototype.start = function () {
	this.interval = 0;
	this.score = 0;
	//this.pipes = [];
	this.birds = [];
	this.preBirds = [];

	this.gen = Neuvol.nextGeneration();
	for (var i in this.gen) {
		var b = new Bird();
		this.birds.push(b);
		this.preBirds.push(0);
	}

	this.generation++;
	this.alives = this.birds.length;
}


Game.prototype.startSuccessCase = function (succesIndex) {
	this.interval = 0;
	this.score = 0;
	//this.pipes = [];
	this.birds = [];
	this.preBirds = [];

	//this.gen = Neuvol.nextGeneration();
	for (var i in this.gen) {
		var b = new Bird();
			
			b.isVisible = !(succesIndex != i);
		
		this.birds.push(b);
		this.preBirds.push(0);
	}

	//this.generation++;
	this.alives = this.birds.length;
}

Game.prototype.update = function () {
	//this.backgroundx += this.backgroundSpeed;
	var nextHoll = 0;
	if (this.birds.length > 0) {
		for (var i = 0; i < this.pipes.length; i += 2) {
			if (this.pipes[i].x + this.pipes[i].width > this.birds[0].x) {
				//nextHoll = this.pipes[i].height/this.height;
				nextHoll = this.pipes[i].height;
				break;
			}
		}
	}

	var goal  = 1200;

	
	for (var i in this.birds) {
		if (this.birds[i].alive) {

				if(this.birds[i].x >= goal)
				{
					this.startSuccessCase(i);
				//	continue;
				}

			/*var inputs = [
			this.birds[i].y / this.height,
			nextHoll
			];*/
			var min = 999999;
			var debugj=0;
			for (var j = 0; j < this.pipes.length; j++) 
			{		
				
				var dis = this.pipes[j].x - (this.birds[i].x + this.birds[i].width);
				if(dis >= 0)
					if(dis <= min)
					{
						min = dis;
						debugj = j
					}
			}


			//if(min==999999)
			//if(i==0)
			//console.log(min)	

			var inputs = [
				this.birds[i].x,
				min,
				this.birds[i].y == 512 - this.birds[i].height
			];

			var output = this.gen[i].compute(inputs);
			if (output[0] > 0.5 && this.birds[i].y == 512 - this.birds[i].height) {
				this.birds[i].flap();
			}

			this.preBirds[i] = this.birds[i].x;
			if (output[1] > 0.3) {
				this.birds[i].x += 3;
				this.score++;
			}

			this.birds[i].update();

			if ((this.birds[i].x == this.preBirds[i]))
				this.birds[i].stopCount++;
			else
				this.birds[i].stopCount = 0;

			if (this.birds[i].isDead(this.height, this.pipes)
					|| this.birds[i].stopCount > 200) 
			{
				this.birds[i].alive = false;
				this.alives--;
				//console.log(this.alives);
				Neuvol.networkScore(this.gen[i], this.score);
				if (this.isItEnd()) {
					this.start();
				}
			}
		
			
		}


	}

		

	for (var i = 0; i < this.pipes.length; i++) {
		this.pipes[i].update();
		//if (this.pipes[i].isOut()) {
			//this.pipes.splice(i, 1);
			//i--;
		//}
	}

	if (this.interval == 0) {
		var deltaBord = 50;
		var pipeHoll = 120;
		//var hollPosition = Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHoll)) +  deltaBord;

		var hollPosition = 450;
		//this.pipes.push(new Pipe({x:this.width, y:0, height:hollPosition}));
		//	this.pipes.push(new Pipe({x:this.width, y:hollPosition/*+pipeHoll*/, height:this.height}));

	}


	this.interval++;
	if (this.interval == this.spawnInterval) {
		this.interval = 0;
	}

	//this.score++;
	this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;
	var self = this;

	if (FPS == 0) {
		setZeroTimeout(function () {
			self.update();
		});
	} else {
		setTimeout(function () {
			self.update();
		}, 1000 / FPS);
	}
}


Game.prototype.isItEnd = function () {
	for (var i in this.birds) {
		if (this.birds[i].alive) {
			return false;
		}
	}
	return true;
}

var frameCount = 0;
Game.prototype.display = function () {
	frameCount++;
	this.ctx.clearRect(0, 0, this.width, this.height);
	for (var i = 0; i < Math.ceil(this.width / images.background.width) + 1; i++) {
		this.ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx % images.background.width), 0)
	}

	this.ctx.drawImage(images.goal, 1200, 340, 28, 172);

	for (var i in this.pipes) {
	
		this.ctx.drawImage(images.pipebottom, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height);

		if(this.pipes[i].type!='pipe')
			this.ctx.drawImage(images.pipetop, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height);
	}

	this.ctx.fillStyle = "#FFC600";
	this.ctx.strokeStyle = "#CE9E00";
	for (var i in this.birds) {
		if (this.birds[i].alive) {
			this.ctx.save();
			this.ctx.translate(this.birds[i].x + this.birds[i].width / 2, this.birds[i].y + this.birds[i].height / 2);
			//this.ctx.rotate(Math.PI/2 * this.birds[i].gravity/20);

			if(this.birds[i].isVisible){

			if(frameCount%3 == 0)
				this.ctx.drawImage(images.bird, -this.birds[i].width / 2, -this.birds[i].height / 2, this.birds[i].width, this.birds[i].height);
			else if (frameCount%3 == 1)
				this.ctx.drawImage(images.bird2, -this.birds[i].width / 2, -this.birds[i].height / 2, this.birds[i].width, this.birds[i].height);
			else
				this.ctx.drawImage(images.bird3, -this.birds[i].width / 2, -this.birds[i].height / 2, this.birds[i].width, this.birds[i].height);

				
			}

			this.ctx.restore();

			if(this.birds[i].isVisible)
			this.ctx.fillText("" + i, this.birds[i].x, this.birds[i].y);
						
		}
	}

	this.ctx.fillStyle = "white";
	this.ctx.font = "20px Oswald, sans-serif";
	this.ctx.fillText("Score : " + this.score, 10, 25);
	this.ctx.fillText("Max Score : " + this.maxScore, 10, 50);
	this.ctx.fillText("Generation : " + this.generation, 10, 75);
	this.ctx.fillText("Alive : " + this.alives + " / " + Neuvol.options.population, 10, 100);

	var self = this;
	requestAnimationFrame(function () {
		self.display();
	});
}

window.onload = function () {
	var sprites = {
		bird: "./img/m1.png",
		bird2: "./img/m2.png",
		bird3: "./img/m3.png",
		background: "./img/m_b.png",
		pipetop: "./img/pipetop.png",
		pipebottom: "./img/pipebottom.png",
		goal: "./img/goal.png"
	}

	var start = function () {
		Neuvol = new Neuroevolution({
			population: 50,
			network: [3, [4], 2],
		});
		game = new Game();
		game.start();
		game.update();
		game.display();
	}


	loadImages(sprites, function (imgs) {
		images = imgs;
		start();
	})

}
