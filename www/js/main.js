var Meow = Meow || {};

Meow.dim = Meow.getGameLandscapeDimensions(700, 350);

Meow.game = new Phaser.Game(Meow.dim.w, Meow.dim.h, Phaser.AUTO);

Meow.game.state.add('Boot', Meow.BootState); 
Meow.game.state.add('Preload', Meow.PreloadState); 
//can add menuw or home state here
Meow.game.state.add('Home', Meow.HomeState);

Meow.game.state.add('Game', Meow.GameState);

Meow.game.state.start('Boot'); 
