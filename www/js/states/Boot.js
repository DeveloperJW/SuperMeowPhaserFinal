var Meow = Meow || {};

//setting game configuration and loading the assets for the loading screen
Meow.BootState = {
  init: function() {
    //loading screen will have a white background
    this.game.stage.backgroundColor = '#fff';
    //added for virtual controller
    this.game.renderer.renderSession.roundPixels = true;
    //this.physics.startSystem(Phaser.Physics.ARCADE);
    
    //scaling options
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    
    //have the game centered horizontally
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    
    //cordova device ready test
    this.game.device.whenReady(function(){
        console.log('Is Cordova Device ready? '+this.game.device.cordova);
    },this);

    //physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);    
  },
  preload: function() {
    //assets we'll use in the loading screen
    this.load.image('preloadbar', 'assets/images/preloader-bar.png');
  },
  create: function() {
    this.state.start('Preload');
  }
};