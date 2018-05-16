/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
* @version      1.0.0 - March 31st 2015
*/

/**
 * @namespace Phaser
 */

/**
 * The VirtualJoystick plugin.
 * 
 * This plugin is responsible for all joysticks and buttons created within your game.
 *
 * Add it to your game via the Phaser Plugin Manager:
 *
 * `this.pad = this.game.plugins.add(Phaser.VirtualJoystick);`
 *
 * Once created you can then add new joysticks and buttons using `addStick` and `addButton` respectively.
 * 
 * This plugin can contain multiple sticks and buttons and will handle processing and updating them all.
 *
 * @class VirtualJoystick
 * @memberOf Phaser
 * @constructor
 * @param {Phaser.Game} game - A reference to the current Phaser.Game instance.
 * @param {Phaser.PluginManager} parent - The Phaser Plugin Manager which looks after this plugin.
 */
Phaser.VirtualJoystick = function (game, parent) {

    Phaser.Plugin.call(this, game, parent);

    /**
    * @property {Phaser.ArraySet} sticks - The Sticks that this plugin is responsible for.
    * @protected
    */
    this.sticks = null;

    /**
    * @property {Phaser.ArraySet} buttons - The Buttons that this plugin is responsible for.
    * @protected
    */
    this.buttons = null;

    /**
    * @property {integer} _pointerTotal - Internal var to track the Input pointer total.
    * @private
    */
    this._pointerTotal = 0;
    
};

Phaser.VirtualJoystick.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.VirtualJoystick.prototype.constructor = Phaser.VirtualJoystick;

/**
* Used by VirtualJoystick.Stick.motionLock. Defines full freedom of movement.
* @constant
* @type {integer}
*/
Phaser.VirtualJoystick.NONE = 0;

/**
* Used by VirtualJoystick.Stick.motionLock. Defines movement locked to the horizontal axis only.
* @constant
* @type {integer}
*/
Phaser.VirtualJoystick.HORIZONTAL = 1;

/**
* Used by VirtualJoystick.Stick.motionLock. Defines movement locked to the vertical axis only.
* @constant
* @type {integer}
*/
Phaser.VirtualJoystick.VERTICAL = 2;

/**
* Used by VirtualJoystick.Button.shape. Defines the hit area geometry shape being used is a Circle.
* @constant
* @type {integer}
*/
Phaser.VirtualJoystick.CIRC_BUTTON = 0;

/**
* Used by VirtualJoystick.Button.shape. Defines the hit area geometry shape being used is a Rectangle.
* @constant
* @type {integer}
*/
Phaser.VirtualJoystick.RECT_BUTTON = 1;

/**
 * Called automatically by the Phaser Plugin Manager.
 * Creates the local properties.
 *
 * @method init
 * @memberOf Phaser.VirtualJoystick
 * @protected
 */
Phaser.VirtualJoystick.prototype.init = function () {

    this.sticks = new Phaser.ArraySet();
    this.buttons = new Phaser.ArraySet();

};

/**
 * Creates a new `Stick` object.
 *
 * `var stick = pad.addStick(x, y, distance, 'texture');`
 * 
 * It consists of two Sprites: one representing the 'base' of the joystick and the other the 'stick' itself, which is the part
 * that the player grabs hold of and interacts with. As the stick is moved you can read back the force being applied, either globally
 * or on a per axis basis.
 *
 * The Stick can either be on-screen all the time, positioned via the `posX` and `posY` setters. Or you can have it only appear when the
 * player touches the screen by setting `showOnTouch` to true.
 *
 * The Stick sprites are added to `Game.Stage`, which is always above `Game.World` in which all other Sprites and display objects live.
 * 
 * Stick force values are analogue, that is they are values between 0 and 1 that vary depending on how the stick
 * is being moved. This allows players to have fine-grained control over your game. If you require just an 'on / off' response you may
 * wish to use the DPad class instead.
 *
 * @method addStick
 * @memberOf Phaser.VirtualJoystick
 * @param {number} x - The x coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} y - The y coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} distance - The distance threshold between the stick and the base. This is how far the stick can be pushed in any direction.
 * @param {string} texture - The Phaser.Cache key of the texture atlas to be used to render this joystick.
 * @param {string} [baseFrame='base'] - The name of the base frame within the joystick texture atlas.
 * @param {string} [stickFrame='stick'] - The name of the stick frame within the joystick texture atlas.
 * @return {Phaser.VirtualJoystick.Stick} The Stick object.
 */
Phaser.VirtualJoystick.prototype.addStick = function (x, y, distance, texture, baseFrame, stickFrame) {

    if (typeof baseFrame === 'undefined') { baseFrame = 'base'; }
    if (typeof stickFrame === 'undefined') { stickFrame = 'stick'; }

    var stick = new Phaser.VirtualJoystick.Stick(this, x, y, distance, texture, baseFrame, stickFrame);

    this.sticks.add(stick);

    this._pointerTotal++;

    if (this._pointerTotal > 2)
    {
        this.game.input.addPointer();
    }

    return stick;

};

/**
 * Creates a new `DPad` object.
 *
 * `var dpad = pad.addDPad(x, y, distance, 'texture');`
 *
 * While the Stick class creates an analogue joystick, the DPad one creates a digital joystick. The difference is that a digital joystick
 * is either "on" or "off" in any given direction. There is no pressure or degree of force in any direction, it's either moving or it isn't.
 * This is the same as the way in which NES style game pads work. The "D" stands for "Direction".
 *
 * Unlike the Stick class the DPad can use a different frame from the texture atlas for each of the 4 directions in which it can move.
 *
 * The DPad can either be on-screen all the time, positioned via the `posX` and `posY` setters. Or you can have it only appear when the
 * player touches the screen by setting `showOnTouch` to true.
 *
 * The DPad sprite is added to `Game.Stage`, which is always above `Game.World` in which all other Sprites and display objects live.
 *
 * @method addDPad
 * @memberOf Phaser.VirtualJoystick
 * @param {Phaser.VirtualJoystick.Pad} pad - The Virtual Pad that this Joystick belongs to.
 * @param {number} x - The x coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} y - The y coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} distance - The distance threshold between the stick and the base. This is how far the stick can be pushed in any direction.
 * @param {string} texture - The Phaser.Cache key of the texture atlas to be used to render this joystick.
 * @param {string} [neutralFrame=neutral] - The name of the frame within the texture atlas that contains the 'neutral' state of the dpad. Neutral is the state when the dpad isn't moved at all.
 * @param {string} [upFrame=up] - The name of the frame within the texture atlas that contains the 'up' state of the dpad.
 * @param {string} [downFrame=down] - The name of the frame within the texture atlas that contains the 'down' state of the dpad.
 * @param {string} [leftFrame=left] - The name of the frame within the texture atlas that contains the 'left' state of the dpad.
 * @param {string} [rightFrame=right] - The name of the frame within the texture atlas that contains the 'right' state of the dpad.
 * @return {Phaser.VirtualJoystick.DPad} The DPad object.
 */
Phaser.VirtualJoystick.prototype.addDPad = function (x, y, distance, texture, neutralFrame, upFrame, downFrame, leftFrame, rightFrame) {

    if (typeof neutralFrame === 'undefined') { neutralFrame = 'neutral'; }
    if (typeof upFrame === 'undefined') { upFrame = 'up'; }
    if (typeof downFrame === 'undefined') { downFrame = 'down'; }
    if (typeof leftFrame === 'undefined') { leftFrame = 'left'; }
    if (typeof rightFrame === 'undefined') { rightFrame = 'right'; }

    var stick = new Phaser.VirtualJoystick.DPad(this, x, y, distance, texture, neutralFrame, upFrame, downFrame, leftFrame, rightFrame);

    this.sticks.add(stick);

    this._pointerTotal++;

    if (this._pointerTotal > 2)
    {
        this.game.input.addPointer();
    }

    return stick;

};

/**
 * Removes the given Stick or DPad object from this plugin and then calls `destroy` on it.
 *
 * @method removeStick
 * @memberOf Phaser.VirtualJoystick
 * @param {Phaser.VirtualJoystick.Stick|Phaser.VirtualJoystick.DPad} stick - The Stick or DPad object to be destroyed and removed.
 */
Phaser.VirtualJoystick.prototype.removeStick = function (stick) {

    this.sticks.remove(stick);

    stick.destroy();

};

/**
 * Creates a new `Button` object - a virtual button.
 *
 * `var button = pad.addButton(x, y, 'texture', 'button-up', 'button-down');`
 * 
 * It consists of one sprite with two frames. One frame depicts the button as it's held down, the other when up.
 *
 * The Button sprite is added to `Game.Stage`, which is always above `Game.World` in which all other Sprites and display objects live.
 *
 * The Button is digital, i.e. it is either 'on or off'. It doesn't have a pressure or force associated with it.
 *
 * @method addButton
 * @memberOf Phaser.VirtualJoystick
 * @param {Phaser.VirtualJoystick.Pad} pad - The Virtual Pad that this Button belongs to.
 * @param {integer} shape - The shape of the buttons hit area. Either Phaser.VirtualJoystick.CIRC_BUTTON or Phaser.VirtualJoystick.RECT_BUTTON.
 * @param {number} x - The x coordinate to draw the button at. The button is centered on this coordinate.
 * @param {number} y - The y coordinate to draw the button at. The button is centered on this coordinate.
 * @param {string} texture - The Phaser.Cache key of the texture atlas to be used to render this button.
 * @param {string} upFrame - The name of the frame within the button texture atlas to be used when the button is in an 'up' state.
 * @param {string} downFrame - The name of the frame within the button texture atlas to be used when the button is in a 'down' state.
 * @return {Phaser.VirtualJoystick.Button} The Button object.
 */
Phaser.VirtualJoystick.prototype.addButton = function (x, y, texture, upFrame, downFrame, shape) {

    if (typeof shape === 'undefined') { shape = Phaser.VirtualJoystick.CIRC_BUTTON; }

    var button = new Phaser.VirtualJoystick.Button(this, shape, x, y, texture, upFrame, downFrame);

    this.buttons.add(button);

    this._pointerTotal++;

    if (this._pointerTotal > 2)
    {
        this.game.input.addPointer();
    }

    return button;

};

/**
 * Removes the given Button object from this plugin and then calls `Button.destroy` on it.
 *
 * @method removeButton
 * @memberOf Phaser.VirtualJoystick
 * @param {Phaser.VirtualJoystick.Button} button - The Button object to be destroyed and removed.
 */
Phaser.VirtualJoystick.prototype.removeButton = function (button) {

    this.buttons.remove(button);

    button.destroy();

};

/**
 * Called automatically by the Phaser Plugin Manager.
 * Updates all Stick and Button objects.
 *
 * @method update
 * @memberOf Phaser.VirtualJoystick
 * @protected
 */
Phaser.VirtualJoystick.prototype.update = function () {

    this.sticks.callAll('update');
    this.buttons.callAll('update');

};

/**
 * Removes and calls `destroy` on all Stick and Button objects in this plugin.
 *
 * @method destroy
 * @memberOf Phaser.VirtualJoystick
 */
Phaser.VirtualJoystick.prototype.destroy = function () {

    this.sticks.removeAll(true);
    this.buttons.removeAll(true);

};
