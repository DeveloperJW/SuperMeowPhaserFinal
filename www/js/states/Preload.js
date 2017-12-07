var ZPlat = ZPlat || {};

//loading the game assets
ZPlat.PreloadState = {
  preload: function() {
    //show loading screen
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'preloadbar');
    this.preloadBar.anchor.setTo(0.5);
    this.preloadBar.scale.setTo(3);

    this.load.setPreloadSprite(this.preloadBar);

    //load game assets    
    this.load.image('platform', 'assets/images/platform.png');
    this.load.image('goal', 'assets/images/goal.png');
    this.load.image('slime', 'assets/images/slime.png');
    //load background?
    //this.load.image('background','');
    this.load.spritesheet('player', 'assets/images/player_spritesheet.png', 28, 30, 5, 1, 1); 
    this.load.spritesheet('fly', 'assets/images/fly_spritesheet.png', 35, 18, 2, 1, 2);    
    this.load.image('arrowButton', 'assets/images/arrowButton.png');  
    //left arrow and right arrow
    this.load.image('arrowButton_left','assets/images/arrowButton_left.png');
    this.load.image('arrowButton_right','assets/images/arrowButton_right.png')
      
    this.load.image('actionButton', 'assets/images/actionButton.png'); 
    
    //load virtual sticker skin
    this.load.atlas('generic', 'assets/virtualjoystick/skins/generic-joystick.png', 'assets/virtualjoystick/skins/generic-joystick.json');
    
    this.load.image('gameTiles', 'assets/images/tiles_spritesheet.png');    
    this.load.tilemap('level1', 'assets/levels/level1.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('level2', 'assets/levels/level2.json', null, Phaser.Tilemap.TILED_JSON);
      //add level 3
    this.load.tilemap('level3','assets/levels/level3.json',null,Phaser.Tilemap.TILED_JSON);
    
    
    
  },
  create: function() {
    this.state.start('Game');
  }
};