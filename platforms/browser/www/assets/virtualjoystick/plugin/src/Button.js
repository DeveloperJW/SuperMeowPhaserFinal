/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
 * A `Button` is a virtual button. It belongs to a parent `Pad` object which is responsible for creating and updating it.
 *
 * Create a new button by using the `Pad.addButton` method.
 * 
 * It consists of one sprite with two frames. One frame depicts the button as it's held down, the other when up.
 *
 * The Button sprite is added to `Game.Stage`, which is always above `Game.World` in which all other Sprites and display objects live.
 *
 * The Button is digital, i.e. it is either 'on or off'. It doesn't have a pressure or force associated with it.
 *
 * @class Phaser.VirtualJoystick.Button
 * @constructor
 * @param {Phaser.VirtualJoystick.Pad} pad - The Virtual Pad that this Button belongs to.
 * @param {integer} shape - The shape of the buttons hit area. Either Phaser.VirtualJoystick.CIRC_BUTTON or Phaser.VirtualJoystick.RECT_BUTTON.
 * @param {number} x - The x coordinate to draw the button at. The button is centered on this coordinate.
 * @param {number} y - The y coordinate to draw the button at. The button is centered on this coordinate.
 * @param {string} texture - The Phaser.Cache key of the texture atlas to be used to render this button.
 * @param {string} upFrame - The name of the frame within the button texture atlas to be used when the button is in an 'up' state.
 * @param {string} downFrame - The name of the frame within the button texture atlas to be used when the button is in a 'down' state.
 */
Phaser.VirtualJoystick.Button = function (pad, shape, x, y, texture, upFrame, downFrame) {

    /**
    * @property {Phaser.VirtualJoystick.Pad} pad - A reference to the Virtual Pad that this Joystick belongs to.
    */
    this.pad = pad;

    /**
    * @property {string} upFrame - The name of the frame within the button texture atlas to be used when the button is in an 'up' state.
    */
    this.upFrame = upFrame;

    /**
    * @property {string} downFrame - The name of the frame within the button texture atlas to be used when the button is in a 'down' state.
    */
    this.downFrame = downFrame;

    /**
    * @property {Phaser.Sprite} sprite - The Sprite that is used to display this button.
    */
    this.sprite = this.pad.game.make.sprite(x, y, texture, upFrame);
    this.sprite.anchor.set(0.5);

    /**
    * @property {Phaser.Circle|Phaser.Rectangle} hitArea - The hit area of the button in which input events will be detected.
    */
    if (shape === Phaser.VirtualJoystick.CIRC_BUTTON)
    {
        this.hitArea = new Phaser.Circle(this.sprite.x, this.sprite.y, this.sprite.width);
    }
    else if (shape === Phaser.VirtualJoystick.RECT_BUTTON)
    {
        this.hitArea = new Phaser.Rectangle(this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height);
    }

    /**
    * @property {Phaser.Pointer} pointer - A reference to the Input Pointer being used to update this button.
    * @protected
    */
    this.pointer = null;

    /**
    * @property {boolean} enabled - Should this button process or dispatch any events? Set to `false` to disable it.
    * @default
    */
    this.enabled = true;

    /**
    * The current down state of this button. A button is determined as being down if it has been pressed.
    * @property {boolean} isDown
    * @protected
    */
    this.isDown = false;

    /**
    * The current up state of this button. A button is determined as being up if it is not being pressed.
    * @property {boolean} isUp
    * @protected
    */
    this.isUp = true;

    /**
    * The onDown signal is dispatched as soon as the button is touched, or clicked when under mouse emulation.
    * 
    * When this signal is dispatched it sends 2 parameters: this button and the Phaser.Pointer object that caused the event:
    * `onDown(Phaser.VirtualJoystick.Button, Phaser.Pointer)`
    *
    * If you have added a Key to this button via `addKey` and that is pressed, the signal will send the Phaser.Key as the second
    * parameter instead of a Phaser.Pointer object.
    * 
    * @property {Phaser.Signal} onDown
    */
    this.onDown = new Phaser.Signal();

    /**
    * The onUp signal is dispatched as soon as the button is released.
    * 
    * When this signal is dispatched it sends 3 parameters: 
    * this button, the Phaser.Pointer object that caused the event and the duration the button was down for:
    * `onUp(Phaser.VirtualJoystick.Button, Phaser.Pointer, duration)`
    *
    * If you have added a Key to this button via `addKey` and that is released, the signal will send the Phaser.Key as the second
    * parameter instead of a Phaser.Pointer object.
    * 
    * @property {Phaser.Signal} onUp
    */
    this.onUp = new Phaser.Signal();

    /**
    * @property {integer} timeDown - The time when the button last entered an `isDown` state.
    * @readOnly
    */
    this.timeDown = 0;

    /**
    * @property {integer} timeUp - The time when the button last entered an `isUp` state.
    * @readOnly
    */
    this.timeUp = 0;

    /**
    * The repeatRate allows you to set how often this button fires the `onDown` signal.
    * At the default setting of zero Button.onDown will be sent only once.
    * No more signals will be sent until the button is released and pressed again.
    *
    * By setting repeatRate to a value above zero you can control the time delay in milliseconds between each onDown signal.
    *
    * For example: `button.repeatRate = 100` would send the onDown signal once every 100ms for as long as the button is held down.
    *
    * To disable a repeat rate set the value back to zero again.
    * 
    * @property {integer} repeatRate
    * @default
    */
    this.repeatRate = 0;

    /**
    * The key that is bound to this button. Pressing it activates the button the same way as clicking does.
    * It is set via `Button.addKey`.
    * @property {Phaser.Key} key
    * @default
    */
    this.key = null;

    /**
    * @property {number} _timeNext - Internal calculation var.
    * @private
    */
    this._timeNext = 0;

    /**
    * @property {number} _scale - Internal calculation var.
    * @private
    */
    this._scale = 1;

    this.pad.game.stage.addChild(this.sprite);

    this.pad.game.input.onDown.add(this.checkDown, this);
    this.pad.game.input.onUp.add(this.checkUp, this);

};

Phaser.VirtualJoystick.Button.prototype = {

    /**
     * You can bind a Keyboard key to this button, so that when the key is pressed the button is activated.
     *
     * Obviously you only want to do this on desktop browsers, but it allows you to minimise your code quantity.
     *
     * When the Key is pressed the Button.onDown signal is dispatched.
     *
     * @method Phaser.VirtualJoystick.Button#addKey
     * @param {integer} keycode - The Phaser.Keyboard const, for example Phaser.Keyboard.CONTROL.
     * @return {Phaser.Key} The Key object bound to this button.
     */
    addKey: function (keycode) {

        if (this.key)
        {
            if (this.key.keyCode === keycode)
            {
                return false;
            }

            this.key.onDown.removeAll();
            this.key.onUp.removeAll();

            this.pad.game.input.keyboard.removeKey(this.key);

            this.key = null;
        }

        if (keycode)
        {
            this.key = this.pad.game.input.keyboard.addKey(keycode);
            this.key.onDown.add(this.keyDown, this);
            this.key.onUp.add(this.keyUp, this);
        }

        return this.key;

    },

    /**
     * The Phaser.Key.onDown callback. Processes the down event for this button.
     *
     * @method Phaser.VirtualJoystick.Button#keyDown
     * @private
     */
    keyDown: function () {

        if (!this.isDown)
        {
            this.sprite.frameName = this.downFrame;

            this.isDown = true;
            this.isUp = false;
            this.timeDown = this.pad.game.time.time;
            this.timeUp = 0;

            this.onDown.dispatch(this, this.key);
        }

    },

    /**
     * The Phaser.Key.onUp callback. Processes the down event for this button.
     *
     * @method Phaser.VirtualJoystick.Button#keyUp
     * @private
     */
    keyUp: function () {

        if (this.isDown)
        {
            this.sprite.frameName = this.upFrame;

            this.isDown = false;
            this.isUp = true;

            this.timeUp = this.pad.game.time.time;

            this.onUp.dispatch(this, this.key, this.duration);
        }

    },

    /**
     * The Input.onDown callback. Processes the down event for this button.
     *
     * @method Phaser.VirtualJoystick.Button#checkDown
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkDown: function (pointer) {

        if (this.enabled && this.isUp && this.hitArea.contains(pointer.x, pointer.y))
        {
            this.pointer = pointer;
            this.sprite.frameName = this.downFrame;

            this.isDown = true;
            this.isUp = false;

            this.timeDown = this.pad.game.time.time;
            this.timeUp = 0;

            this.onDown.dispatch(this, pointer);
        }

    },

    /**
     * The Input.onUp callback. Processes the up event for this button.
     *
     * @method Phaser.VirtualJoystick.Button#checkUp
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkUp: function (pointer) {

        if (pointer === this.pointer)
        {
            this.pointer = null;
            this.sprite.frameName = this.upFrame;

            this.isDown = false;
            this.isUp = true;

            this.timeUp = this.pad.game.time.time;

            this.onUp.dispatch(this, pointer, this.duration);
        }

    },

    /**
     * The update callback. This is called automatically by the Pad parent.
     *
     * @method Phaser.VirtualJoystick.Button#update
     * @private
     */
    update: function () {

        if (this.repeatRate > 0 && this.isDown && this.pad.game.time.time >= this._timeNext)
        {
            this.onDown.dispatch(this, this.pointer);
            this._timeNext = this.pad.game.time.time + this.repeatRate;
        }

    },

    /**
     * Visually aligns the button to the bottom left of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the button.
     *
     * @method Phaser.VirtualJoystick.Button#alignBottomLeft
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the button.
     */
    alignBottomLeft: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.sprite.width / 2) + spacing;
        var h = (this.sprite.height / 2) + spacing;

        this.posX = w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Visually aligns the button to the bottom right of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the button.
     *
     * @method Phaser.VirtualJoystick.Button#alignBottomRight
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the button.
     */
    alignBottomRight: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.sprite.width / 2) + spacing;
        var h = (this.sprite.height / 2) + spacing;

        this.posX = this.pad.game.width - w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Destroys this Button.
     * 
     * Removes all associated event listeners and signals and calls destroy on the button sprite.
     *
     * @method Phaser.VirtualJoystick.Button#destroy
     */
    destroy: function () {

        this.pad.game.input.onDown.remove(this.checkDown, this);
        this.pad.game.input.onUp.remove(this.checkUp, this);

        this.sprite.destroy();

        this.onDown.dispose();
        this.onUp.dispose();

        this.hitArea = null;

        this.pointer = null;

        this._scale = null;

        this.pad = null;

    }

};

/**
* The x coordinate the button is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the button on-screen. Value can even be tweened to display or hide the button in interesting ways.
* 
* @name Phaser.VirtualJoystick.Button#posX
* @property {number} posX
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "posX", {

    get: function () {

        return this.sprite.x;

    },

    set: function (x) {

        if (this.sprite.x !== x)
        {
            this.sprite.x = x;
            this.hitArea.x = x;
        }

    }

});

/**
* The y coordinate the button is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the button on-screen. Value can even be tweened to display or hide the button in interesting ways.
* 
* @name Phaser.VirtualJoystick.Button#posY
* @property {number} posY
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "posY", {

    get: function () {

        return this.sprite.y;

    },

    set: function (y) {

        if (this.sprite.y !== y)
        {
            this.sprite.y = y;
            this.hitArea.y = y;
        }

    }

});

/**
* The alpha value of the Button.
* 
* Adjusting this value changes the alpha property of button sprite.
* 
* @name Phaser.VirtualJoystick.Button#alpha
* @property {number} alpha
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "alpha", {

    get: function () {

        return this.sprite.alpha;

    },

    set: function (value) {

        this.sprite.alpha = value;

    }

});

/**
* The visible state of the Button.
* 
* Adjusting this value changes the visible property of the button sprite.
*
* Note that this button will carry on processing and dispatching events even when not visible.
* If you wish to disable the button from processing events see `Button.enabled`.
* 
* @name Phaser.VirtualJoystick.Button#visible
* @property {number} visible
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "visible", {

    get: function () {

        return this.sprite.visible;

    },

    set: function (value) {

        this.sprite.visible = value;

    }

});

/**
* The scale of the Button. The scale is applied evenly to both the x and y axis of the Button.
* You cannot specify a different scale per axis.
* 
* Adjusting this value changes the scale of the button sprite and recalculates the hit area.
* 
* @name Phaser.VirtualJoystick.Button#scale
* @property {number} scale
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "scale", {

    get: function () {

        return this._scale;

    },

    set: function (value) {

        if (this._scale !== value)
        {
            this.sprite.scale.set(value);

            this.hitArea.setTo(this.sprite.x, this.sprite.y, this.sprite.width);

            this._scale = value;
        }

    }

});

/**
* The duration in milliseconds that the Button has been held down for.
* If the button is not currently in an `onDown` state it returns the duration the button was previously held down for.
* If the button is in an `onDown` state it returns the current duration in ms.
* 
* @name Phaser.VirtualJoystick.Button#duration
* @property {integer} duration
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Button.prototype, "duration", {

    get: function () {

        if (this.isUp)
        {
            return this.timeUp - this.timeDown;
        }

        return this.game.time.time - this.timeDown;

    }

});
