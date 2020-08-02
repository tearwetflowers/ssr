(function ($) {
	$.fn.fireworks = function(options) {
    // 设置默认值
		options = options || {};

    options.sound = options.sound || false;
		options.opacity = options.opacity || 1;
		options.width = options.width || $(this).width();
		options.height = options.height || $(this).height();

    var fireworksField = this,
        particles = [],
        rockets = [],
        MAX_PARTICLES = 400,
        SCREEN_WIDTH = options.width,
        SCREEN_HEIGHT = options.height;

    // 创建画布并获取上下文
    var canvas = document.createElement('canvas');
    canvas.id = 'fireworksField';
		canvas.width = SCREEN_WIDTH;
		canvas.height = SCREEN_HEIGHT;
		canvas.style.width  = SCREEN_WIDTH + 'px';
		canvas.style.height = SCREEN_HEIGHT + 'px';
		canvas.style.position = 'absolute';
		canvas.style.top = '0px';
		canvas.style.left = '0px';
    canvas.style.opacity = options.opacity;
    var context = canvas.getContext('2d');

    // 粒子对象
    function Particle(pos) {
        this.pos = {
            x: pos ? pos.x : 0,
            y: pos ? pos.y : 0
        };
        this.vel = {
            x: 0,
            y: 0
        };
        this.shrink = 0.97;
        this.size = 2;

        this.resistance = 1;
        this.gravity = 0;

        this.flick = false;

        this.alpha = 1;
        this.fade = 0;
        this.color = 0;
    }

    Particle.prototype.update = function() {
        // 施加阻力
        this.vel.x *= this.resistance;
        this.vel.y *= this.resistance;

        // 重力下降
        this.vel.y += this.gravity;

        // 根据速度更新位置
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        // 收缩
        this.size *= this.shrink;

        // 消退
        this.alpha -= this.fade;
    };

    Particle.prototype.render = function(c) {
        if (!this.exists()) {
            return;
        }

        c.save();

        c.globalCompositeOperation = 'lighter';

        var x = this.pos.x,
            y = this.pos.y,
            r = this.size / 2;

        var gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
        gradient.addColorStop(0.1, "rgba(255,255,255," + this.alpha + ")");
        gradient.addColorStop(0.8, "hsla(" + this.color + ", 100%, 50%, " + this.alpha + ")");
        gradient.addColorStop(1, "hsla(" + this.color + ", 100%, 50%, 0.1)");


        c.fillStyle = gradient;

        c.beginPath();
        c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size : this.size, 0, Math.PI * 2, true);
        c.closePath();
        c.fill();//填充当前绘图（路径）

        c.restore();//返回之前保存过的路径状态和属性
    };

    Particle.prototype.exists = function() {
        return this.alpha >= 0.1 && this.size >= 1;
    };

    // The Rocket Object
    function Rocket(x) {
        Particle.apply(this, [{
            x: x,
            y: SCREEN_HEIGHT}]);

        this.explosionColor = 0;
    }

    Rocket.prototype = new Particle();
    Rocket.prototype.constructor = Rocket;

    Rocket.prototype.explode = function() {
        if (options.sound) {
          var randomNumber = function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }(0, 2);
          audio.src = sounds[randomNumber].prefix + sounds[randomNumber].data;
          audio.play();
        }

        var count = Math.random() * 10 + 80;

        for (var i = 0; i < count; i++) {
            var particle = new Particle(this.pos);
            var angle = Math.random() * Math.PI * 2;

            // 使用余弦模拟3D效果，并在中间放置更多粒子
            // var speed = Math.cos(Math.random() * Math.PI / 2) * 15;
            // particle.vel.x = Math.cos(angle) * speed;
            // particle.vel.y = Math.sin(angle) * speed;


             // 贝塞尔曲线模拟爱心
             particle.vel.x = 16 * Math.pow(Math.sin(angle), 3);
             particle.vel.y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));

            particle.size = 10;

            particle.gravity = 0.2;
            particle.resistance = 0.92;
            particle.shrink = Math.random() * 0.05 + 0.93;

            particle.flick = true;
            particle.color = this.explosionColor;

           

            particles.push(particle);
        }
    };

    Rocket.prototype.render = function(c) {
        if (!this.exists()) {
            return;
        }

        c.save();

        c.globalCompositeOperation = 'lighter';

        var x = this.pos.x,
            y = this.pos.y,
            r = this.size / 2;

        var gradient = c.createRadialGradient(x, y, 0.1, x, y, r);//创建放射状/环形的渐变（用在画布内容上）
        gradient.addColorStop(0.1, "rgba(255, 255, 255 ," + this.alpha + ")");//规定渐变对象中的颜色和停止位置
        gradient.addColorStop(1, "rgba(0, 0, 0, " + this.alpha + ")");


        c.fillStyle = gradient;//设置或返回用于填充绘画的颜色、渐变或模式

        c.beginPath();
        c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size / 2 + this.size / 2 : this.size, 0, Math.PI * 2, true);
        c.closePath();
        c.fill();

        c.restore();
    };

    var loop = function() {
        // 更新屏幕尺寸
        if (SCREEN_WIDTH != window.innerWidth) {
            canvas.width = SCREEN_WIDTH = window.innerWidth;
        }
        if (SCREEN_HEIGHT != window.innerHeight) {
            canvas.height = SCREEN_HEIGHT = window.innerHeight;
        }

        // 清除画布
        context.fillStyle = "rgba(0, 0, 0, 0.3)";
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        var existingRockets = [];

        for (var i = 0; i < rockets.length; i++) {
            // 更新和渲染
            rockets[i].update();
            rockets[i].render(context);

            // 用毕达哥拉斯计算距离
            var distance = Math.sqrt(Math.pow(SCREEN_WIDTH - rockets[i].pos.x, 2) + Math.pow(SCREEN_HEIGHT - rockets[i].pos.y, 2));

            // 如果火箭位于中间位置，则有1％的随机几率
            var randomChance = rockets[i].pos.y < (SCREEN_HEIGHT * 2 / 3) ? (Math.random() * 100 <= 1) : false;

            /* 爆炸规则
                  -屏幕的80％
                 - 下降
                 -靠近鼠标
                 -1％随机爆炸的机会
            */
            if (rockets[i].pos.y < SCREEN_HEIGHT / 5 || rockets[i].vel.y >= 0 || distance < 50 || randomChance) {
                rockets[i].explode();
            } else {
                existingRockets.push(rockets[i]);
            }
        }

        rockets = existingRockets;

        var existingParticles = [];

        for (i = 0; i < particles.length; i++) {
            particles[i].update();

            // 渲染并保存可以渲染的粒子
            if (particles[i].exists()) {
                particles[i].render(context);
                existingParticles.push(particles[i]);
            }
        }

        // 使用现有粒子更新数组-应该对旧粒子进行垃圾收集
        particles = existingParticles;

        while (particles.length > MAX_PARTICLES) {
            particles.shift();
        }
    };

    var launchFrom = function(x) {
        if (rockets.length < 10) {
            var rocket = new Rocket(x);
            rocket.explosionColor = Math.floor(Math.random() * 360 / 10) * 10;
            rocket.vel.y = Math.random() * -3 - 4;
            rocket.vel.x = Math.random() * 6 - 3;
            rocket.size = 8;
            rocket.shrink = 0.999;
            rocket.gravity = 0.01;
            rockets.push(rocket);
        }
    };

    var launch = function() {
        launchFrom(SCREEN_WIDTH / 2);
    };

    // 附加画布并开始循环
    $(fireworksField).append(canvas);
    setInterval(launch, 800);
    setInterval(loop, 1000 / 50);

    return fireworksField;
  };
}(jQuery));
