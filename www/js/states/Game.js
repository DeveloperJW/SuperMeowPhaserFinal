var Meow = Meow || {};

Meow.GameState = {

  init: function(level) {    

    this.currentLevel = level || 'level1';
    
    //constants
    this.RUNNING_SPEED = 180;
    this.JUMPING_SPEED = 500;
    this.BOUNCING_SPEED = 150;

    //gravity
    this.game.physics.arcade.gravity.y = 1000;    
    
    //cursor keys to move the player
    this.cursors = this.game.input.keyboard.createCursorKeys();
      
    //DONE: store current coins
    //this.myCoins=0;
    //get the number of coins from localStorage
    this.myCoins=+localStorage.getItem('currentCoin');
      
  },//end of init
  create: function() {
    //load current level
    this.loadLevel();
    //show on-screen touch controls
    this.createOnscreenControls();
    //coin sound
    this.coinSound = this.add.audio('coin_sound');
    //hit enemy sound
    this.hitSound=this.add.audio('kick');
    //game over sound
    this.gameoverSound=this.add.audio('gameover');
    //background music
    this.backgroundSound=this.add.audio('background_music');
    //show number of coins
    var style={font:'30px Arial', fill:'#fff'};
    this.coinsCountLabel=this.add.text(10, 20, 'Coins: '+this.myCoins,style);
    this.coinsCountLabel.fixedToCamera=true;
    //the following code are for virtual joystick
    this.pad = this.game.plugins.add(Phaser.VirtualJoystick);
    this.stick = this.pad.addStick(0, 0, 100, 'generic');
    //scale the stick size to 50%
    this.stick.scale=0.5;
    //make the joystick more transparent
    this.stick.apha=0.5;
    this.stick.alignBottomLeft(20);
    this.stick.motionLock = Phaser.VirtualJoystick.HORIZONTAL;
    //play background music
    this.backgroundSound.play();
      
  },   //end of create
  update: function() { 
    //collision between the player, enemies and the collision layer
    this.game.physics.arcade.collide(this.player, this.collisionLayer); 
    this.game.physics.arcade.collide(this.enemies, this.collisionLayer); 
    
    //collision between player and enemies
    this.game.physics.arcade.collide(this.player, this.enemies, this.hitEnemy, null, this);
    
    //overlap between player and goal
    this.game.physics.arcade.overlap(this.player, this.goal, this.changeLevel, null, this);
    
      
    //collision between player and coin
    this.game.physics.arcade.overlap(this.player, this.coins, this.collectCoin, null, this);
    
    //generic platformer behavior
    this.player.body.velocity.x = 0;
    

    if(this.cursors.left.isDown || (this.stick.isDown && this.stick.forceX<0)) {
      this.player.body.velocity.x = -this.RUNNING_SPEED;
      this.player.scale.setTo(-1, 1);
      this.player.play('walking');
    }
    else if(this.cursors.right.isDown || (this.stick.isDown && this.stick.forceX>0)) {
      this.player.body.velocity.x = this.RUNNING_SPEED;
      this.player.scale.setTo(1, 1);
      this.player.play('walking');
    }
    else {
      this.player.animations.stop();
      this.player.frame = 2;
    }

    if((this.cursors.up.isDown || this.player.customParams.mustJump) && (this.player.body.blocked.down || this.player.body.touching.down)) {
      this.player.body.velocity.y = -this.JUMPING_SPEED;
      this.player.customParams.mustJump = false;
    }
    
    //kill enemy if it falls off
    if(this.player.bottom == this.game.world.height){
      this.gameOver();
    }
  },//end of update
  loadLevel: function(){  
    //create a tilemap object
    this.map = this.add.tilemap(this.currentLevel);
    
    //join the tile images to the json data
    this.map.addTilesetImage('tiles_spritesheet', 'gameTiles');
    this.map.addTilesetImage('420_background','420_background');
    this.map.addTilesetImage('420_iceland','420_iceland');
    this.map.addTilesetImage('420_ghost','420_ghost');
    
    //create tile layers
    this.backgroundLayer = this.map.createLayer('backgroundLayer');
    this.collisionLayer = this.map.createLayer('collisionLayer');
    
    //send background to the back
    this.game.world.sendToBack(this.backgroundLayer);
    
    //collision layer should be collisionLayer
    this.map.setCollisionBetween(1, 160, true, 'collisionLayer');
    
    //resize the world to fit the layer
    this.collisionLayer.resizeWorld();
    
    //create the goal
    var goalArr = this.findObjectsByType('goal', this.map, 'objectsLayer');
    this.goal = this.add.sprite(goalArr[0].x, goalArr[0].y, goalArr[0].properties.key);
    this.game.physics.arcade.enable(this.goal);
    this.goal.body.allowGravity = false;
    this.goal.nextLevel = goalArr[0].properties.nextLevel;
    
    //create player
    var playerArr = this.findObjectsByType('player', this.map, 'objectsLayer');
    //this.player = this.add.sprite(playerArr[0].x, playerArr[0].y, 'player', 0);
    this.player=this.add.sprite(playerArr[0].x, playerArr[0].y, 'player',2);
    this.player.anchor.setTo(0.5);
    //this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
    //this.player.animations.add('walking',[1,2,3,5,3,2],10,true);
    this.player.animations.add('walking',[0,5,7,8,1,3,6,4],10,true);
    this.game.physics.arcade.enable(this.player);
    this.player.customParams = {};
    this.player.body.collideWorldBounds = true;    
    //change player bounding box
    //this.player.body.setSize(30, 53, 0, 0);

    //follow player with the camera
    this.game.camera.follow(this.player);
    
    //create enemies
    this.enemies = this.add.group();
    this.createEnemies();
    
    //create coins ----------------------------
    this.coins=this.add.group();
    this.createCoins();
  },
  createOnscreenControls: function(){
    this.actionButton = this.add.button(this.game.width - 120, this.game.height - 100, 'actionButton');

    this.actionButton.alpha = 0.5;

    this.actionButton.fixedToCamera = true;

    this.actionButton.events.onInputDown.add(function(){
      this.player.customParams.mustJump = true;
    }, this);

    this.actionButton.events.onInputUp.add(function(){
      this.player.customParams.mustJump = false;
    }, this);
    
      
  },//end of onScreen controller
  findObjectsByType: function(targetType, tilemap, layer){
    var result = [];
    
    tilemap.objects[layer].forEach(function(element){
      if(element.properties.type == targetType) {
        element.y -= tilemap.tileHeight;        
        result.push(element);
      }
    }, this);
    
    return result;
  },
  changeLevel: function(player, goal){
      //stop the background music of current level
      this.backgroundSound.stop();
    this.game.state.start('Game', true, false, goal.nextLevel);
      //TODO: need to store current coin number
      //save current coin
    localStorage.setItem('currentCoin',this.myCoins);
      
      
  },
  createEnemies: function(){
    var enemyArr = this.findObjectsByType('enemy', this.map, 'objectsLayer');
    var enemy;
    
    enemyArr.forEach(function(element){
      enemy = new Meow.Enemy(this.game, element.x, element.y, 'slime', +element.properties.velocity, this.map);
      this.enemies.add(enemy);
    }, this);
  },
    createCoins: function(){
    var coinArr=this.findObjectsByType('coin',this.map,'objectsLayer');
    var coin;
    coinArr.forEach(function(element){
        coin=new Meow.Coin(this.game, element.x,element.y,'gold',this.map);
        this.coins.add(coin);
    },this);
        
    },
  hitEnemy: function(player, enemy){
    if(enemy.body.touching.up){
      enemy.kill();
      player.body.velocity.y = -this.BOUNCING_SPEED;
    this.hitSound.play();
    }
    else {
        this.player.kill();
      this.gameOver();
    }
  },
    collectCoin:function(player,coin){
        if(coin.body.touching){
            coin.kill();
            this.myCoins++;
            this.coinSound.play();
            this.coinsCountLabel.text='Coins: '+this.myCoins;
        }
    },
  gameOver: function(){
    this.player.kill();
      //stop the background
      this.backgroundSound.stop();
    //play the game over sound
    this.gameoverSound.play();
    this.updateHighscore();
    localStorage.setItem('currentCoin', 0);
    //game over messages
    var style={font:'30px Arial', fill:'#fff'};
    this.gameOverLabel=this.add.text(this.game.width/2, this.game.height/2-30, 'GAME OVER', style);
    this.gameOverLabel.fixedToCamera=true;
      
    style = {font: '20px Arial', fill: '#fff'};
    this.highScoreLabel=this.add.text(this.game.width/2, this.game.height/2 + 20, 'High score: ' + this.highScore, style);
    this.highScoreLabel.fixedToCamera=true;
      
    this.scoreMsg=this.add.text(this.game.width/2, this.game.height/2 + 50, 'Your score: ' + this.myCoins, style);
    this.scoreMsg.fixedToCamera=true;
      
     this.tap=this.add.text(this.game.width/2, this.game.height/2 + 90, 'Tap to play again', style);
        this.tap.fixedToCamera=true;
      this.game.input.onDown.addOnce(this.restart, this);
  },
    restart: function(){
    //this.game.state.start('Game', true, false, this.currentLevel);
    this.game.state.start('Game', true, false, 'level1');
  },
    //highest score into LocalStorage
    updateHighscore: function(){
    this.highScore = +localStorage.getItem('highScore');
    
    //do we have a new high score
    if(this.highScore < this.myCoins){
      this.highScore = this.myCoins;
      
      //save new high score
      localStorage.setItem('highScore', this.highScore);
    }
  },
    render: function()
    {
        // this.game.debug.text(this.game.time.fps || '--', 20, 70, "#00ff00", "40px Courier");
    }
    
  
};//name of GameState
