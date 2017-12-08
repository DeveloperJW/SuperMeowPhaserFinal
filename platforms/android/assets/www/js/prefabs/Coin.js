var Meow = Meow || {};

Meow.Coin = function(game, x, y, key, tilemap) {
  Phaser.Sprite.call(this, game, x, y, key);
  
  this.game = game;
  this.tilemap = tilemap;
  this.anchor.setTo(0.5);
  
  //enable physics
  this.game.physics.arcade.enableBody(this);
  //this.body.collideWorldBounds = true;
    this.body.allowGravity=false;
    
};

Meow.Coin.prototype = Object.create(Phaser.Sprite.prototype);
Meow.Coin.prototype.constructor = Meow.Coin;

Meow.Coin.prototype.update = function(){
};