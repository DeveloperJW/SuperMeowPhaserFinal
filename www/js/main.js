var ZPlat = ZPlat || {};

ZPlat.dim = ZPlat.getGameLandscapeDimensions(700, 350);

ZPlat.game = new Phaser.Game(ZPlat.dim.w, ZPlat.dim.h, Phaser.AUTO);

ZPlat.game.state.add('Boot', ZPlat.BootState); 
ZPlat.game.state.add('Preload', ZPlat.PreloadState); 
ZPlat.game.state.add('Game', ZPlat.GameState);

ZPlat.game.state.start('Boot'); 
