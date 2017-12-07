var ZPlat = ZPlat || {};

ZPlat.HomeState = {
    
    //preload: function(){
    //this.load.image('background','assets/images/background.png');
    
//},
    create: function(){
        var background=this.game.add.sprite(0,0,'background');
        background.inputEnabled=true;
        
        background.events.onInputDown.add(function(){
            
            this.state.start('Game');
        },this);
        
        var style={font:'35px Arial',fill:"#fff"};
        this.game.add.text(200,this.game.world.centerY-10,'TOUCH TO START',style);
    }
};