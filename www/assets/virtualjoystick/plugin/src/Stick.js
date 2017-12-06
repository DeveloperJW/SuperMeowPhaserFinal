/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
 * A `Stick` is a virtual joystick. It belongs to a parent `Pad` object which is responsible for creating and updating it.
 *
 * Create a new stick by using the `Pad.addStick` method.
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
 * @class Phaser.VirtualJoystick.Stick
 * @constructor
 * @param {Phaser.VirtualJoystick.Pad} pad - The Virtual Pad that this Joystick belongs to.
 * @param {number} x - The x coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} y - The y coordinate to draw the joystick at. The joystick is centered on this coordinate.
 * @param {number} distance - The distance threshold between the stick and the base. This is how far the stick can be pushed in any direction.
 * @param {string} texture - The Phaser.Cache key of the texture atlas to be used to render this joystick.
 * @param {string} [baseFrame='base'] - The name of the frame within the joystick texture atlas that contains the 'base' image.
 * @param {string} [stickFrame='stick'] - The name of the frame within the joystick texture atlas that contains the 'stick' image.
 */
Phaser.VirtualJoystick.Stick = function (pad, x, y, distance, texture, baseFrame, stickFrame) {

    /**
    * @property {Phaser.VirtualJoystick.Pad} pad - A reference to the Virtual Pad that this Joystick belongs to.
    */
    this.pad = pad;

    /**
    * @property {string} baseFrame - The name of the frame within the joystick texture atlas that contains the 'base' image.
    */
    this.baseFrame = baseFrame;

    /**
    * @property {string} stickFrame - The name of the frame within the joystick texture atlas that contains the 'stick' image.
    */
    this.stickFrame = stickFrame;

    /**
    * @property {Phaser.Point} position - The position of the joystick in screen coordinates. To adjust please use `posX` and `posY`.
    * @protected
    */
    this.position = new Phaser.Point(x, y);

    /**
    * @property {Phaser.Line} line - The line object used for stick to base calculations.
    * @protected
    */
    this.line = new Phaser.Line(this.position.x, this.position.y, this.position.x, this.position.y);

    /**
    * @property {Phaser.Sprite} baseSprite - The Sprite that is used to display the base of the joystick.
    */
    this.baseSprite = this.pad.game.make.sprite(this.position.x, this.position.y, texture, baseFrame);
    this.baseSprite.anchor.set(0.5);

    /**
    * @property {Phaser.Sprite} stickSprite - The Sprite that is used to display the stick or handle of the joystick.
    */
    this.stickSprite = this.pad.game.make.sprite(this.position.x, this.position.y, texture, stickFrame);
    this.stickSprite.anchor.set(0.5);

    /**
    * @property {Phaser.Circle} baseHitArea - The circular hit area that defines the base of the joystick.
    */
    this.baseHitArea = new Phaser.Circle(this.position.x, this.position.y, distance);

    /**
    * @property {Phaser.Circle} stickHitArea - The circular hit area that defines the stick or handle of the joystick.
    */
    this.stickHitArea = new Phaser.Circle(this.position.x, this.position.y, this.stickSprite.width);

    /**
    * @property {Phaser.Point} limitPoint - A Point object that holds the stick limits.
    * @protected
    */
    this.limitPoint = new Phaser.Point();

    /**
    * @property {Phaser.Pointer} pointer - A reference to the Input Pointer being used to update this joystick.
    * @protected
    */
    this.pointer = null;

    /**
    * @property {boolean} enabled - Should this joystick process or dispatch any events? Set to `false` to disable it.
    * @default
    */
    this.enabled = true;

    /**
    * The current down state of this joystick. A joystick is determined as being down if it has been pressed and interacted with.
    * If it has a `deadZone` set then it's not considered as being down unless it has moved beyond the limits of the deadZone.
    * @property {boolean} isDown
    * @protected
    */
    this.isDown = false;

    /**
    * The current up state of this joystick. A joystick is determined as being up if it is not being interacted with.
    * If it has a `deadZone` set then it's considered as being up until it has moved beyond the limits of the deadZone.
    * @property {boolean} isUp
    * @protected
    */
    this.isUp = true;

    /**
    * The onDown signal is dispatched as soon as the joystick is touched, or clicked when under mouse emulation.
    * If it has a `deadZone` set then it's not dispatched until it has moved beyond the limits of the deadZone.
    * When this signal is dispatched it sends 2 parameters: this Stick and the Phaser.Pointer object that caused the event:
    * `onDown(Phaser.VirtualJoystick.Stick, Phaser.Pointer)`
    * 
    * @property {Phaser.Signal} onDown
    */
    this.onDown = new Phaser.Signal();

    /**
    * The onUp signal is dispatched as soon as the joystick is released, having previously been in an `isDown` state.
    * When this signal is dispatched it sends 2 parameters: this Stick and the Phaser.Pointer object that caused the event:
    * `onUp(Phaser.VirtualJoystick.Stick, Phaser.Pointer)`
    * 
    * @property {Phaser.Signal} onUp
    */
    this.onUp = new Phaser.Signal();

    /**
    * The onMove signal is dispatched whenever the joystick is moved as a result of a device Touch movement event.
    * When this signal is dispatched it sends 4 parameters: this Stick and the `force`, `forceX` and `forceY` values:
    * `onMove(Phaser.VirtualJoystick.Stick, force, forceX, forceY)`
    * This signal is only dispatched when a touch move event is received, even if the stick is held in a specific direction.
    * If you wish to constantly check the position of the joystick then you should use the `onUpdate` signal instead of `onMove`.
    * 
    * @property {Phaser.Signal} onMove
    */
    this.onMove = new Phaser.Signal();

    /**
    * The onUpdate signal is dispatched constantly for as long as the joystick is in an `isDown` state.
    * When this signal is dispatched it sends 4 parameters: this Stick and the `force`, `forceX` and `forceY` values:
    * `onUpdate(Phaser.VirtualJoystick.Stick, force, forceX, forceY)`
    * This is a high frequency signal so be careful what is bound to it. If there are computationally cheaper ways of 
    * reacting to this joysticks movement then you should explore them.
    * 
    * @property {Phaser.Signal} onUpdate
    */
    this.onUpdate = new Phaser.Signal();

    /**
    * @property {integer} timeDown - The time when the joystick last entered an `isDown` state.
    * @readOnly
    */
    this.timeDown = 0;

    /**
    * @property {integer} timeUp - The time when the joystick last entered an `isUp` state.
    * @readOnly
    */
    this.timeUp = 0;

    /**
    * @property {number} angle - The angle of the joystick in degrees. From -180 to 180 where zero is right-handed.
    * @readOnly
    */
    this.angle = 0;

    /**
    * @property {number} angleFull - The angle of the joystick in degrees. From 0 to 360 where zero is right-handed.
    * @readOnly
    */
    this.angleFull = 0;

    /**
    * The quadrant the joystick is in.
    * Where 315 to 45 degrees is quadrant 0. 
    * 45 to 135 degrees is quadrant 1. 
    * 135 to 225 degrees is quadrant 2.
    * 225 to 315 degrees is quadrant 3.
    * @property {integer} quadrant
    * @readOnly
    */
    this.quadrant = 0;

    /**
    * The nearest octant of the joystick. Where each octant is 360 degrees / 45.
    * @property {integer} octant
    * @readOnly
    */
    this.octant = 0;

    /**
    * A Stick can be motion locked. When locked it can only move along the specified axis.
    * `motionLock = Phaser.VirtualJoystick.HORIZONTAL` will only allow it to move horizontally.
    * `motionLock = Phaser.VirtualJoystick.VERTICAL` will only allow it to move vertically.
    * `motionLock = Phaser.VirtualJoystick.NONE` will allow it to move freely.
    * @property {integer} motionLock
    * @default Phaser.VirtualJoystick.NONE
    */
    this.motionLock = Phaser.VirtualJoystick.NONE;

    /**
    * @property {number} _distance - Internal calculation var.
    * @private
    */
    this._distance = distance;

    /**
    * @property {number} _deadZone - Internal calculation var.
    * @private
    */
    this._deadZone = distance * 0.15;

    /**
    * @property {number} _scale - Internal calculation var.
    * @private
    */
    this._scale = 1;

    /**
    * @property {boolean} _tracking - Internal var.
    * @private
    */
    this._tracking = false;

    /**
    * @property {boolean} _showOnTouch - Internal var.
    * @private
    */
    this._showOnTouch = false;

    this.pad.game.stage.addChild(this.baseSprite);
    this.pad.game.stage.addChild(this.stickSprite);

    this.pad.game.input.onDown.add(this.checkDown, this);
    this.pad.game.input.onUp.add(this.checkUp, this);
    this.pad.game.input.addMoveCallback(this.moveStick, this);

};

Phaser.VirtualJoystick.Stick.prototype = {

    /**
     * The Input.onDown callback. Processes the down event for this stick, or starts tracking if required.
     *
     * @method Phaser.VirtualJoystick.Stick#checkDown
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkDown: function (pointer) {

        if (this.enabled && this.isUp)
        {
            this.pointer = pointer;

            if (this.motionLock === Phaser.VirtualJoystick.NONE)
            {
                this.line.end.copyFrom(this.pointer);
            }
            else if (this.motionLock === Phaser.VirtualJoystick.HORIZONTAL)
            {
                this.line.end.x = this.pointer.x;
            }
            else if (this.motionLock === Phaser.VirtualJoystick.VERTICAL)
            {
                this.line.end.y = this.pointer.y;
            }

            if (this._showOnTouch)
            {
                this.line.start.copyFrom(pointer);
                this.posX = pointer.x;
                this.posY = pointer.y;
                this.visible = true;
                this.setDown();
            }
            else
            {
                if (this.stickHitArea.contains(pointer.x, pointer.y))
                {
                    if (this.line.length <= this.deadZone)
                    {
                        this._tracking = true;
                    }
                    else
                    {
                        this.setDown();
                        this.moveStick();
                    }
                }
            }
        }

    },

    /**
     * The Input.onUp callback. Processes the up event for this stick.
     *
     * @method Phaser.VirtualJoystick.Stick#checkUp
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkUp: function (pointer) {

        if (pointer === this.pointer)
        {
            this.pointer = null;

            this.stickHitArea.x = this.position.x;
            this.stickHitArea.y = this.position.y;

            this.stickSprite.x = this.stickHitArea.x;
            this.stickSprite.y = this.stickHitArea.y;

            this.line.end.copyFrom(this.line.start);

            this.isDown = false;
            this.isUp = true;

            this.timeUp = this.pad.game.time.time;

            this.onUp.dispatch(this, pointer);

            if (this._showOnTouch)
            {
                this.visible = false;
            }
        }

    },

    /**
     * Internal down handler. Activated either onDown or after tracking if the stick has a dead zone.
     *
     * @method Phaser.VirtualJoystick.Stick#setDown
     * @private
     */
    setDown: function () {

        this.isDown = true;
        this.isUp = false;
        this.timeDown = this.pad.game.time.time;
        this.timeUp = 0;

        this._tracking = false;

        this.checkArea();

        this.onDown.dispatch(this, this.pointer);

    },

    /**
     * Internal calculation method. Updates the various angle related properties.
     *
     * @method Phaser.VirtualJoystick.Stick#checkArea
     * @private
     */
    checkArea: function () {

        this.angle = this.pad.game.math.radToDeg(this.line.angle);
        this.angleFull = this.angle;

        if (this.angleFull < 0)
        {
            this.angleFull += 360;
        }

        this.octant = 45 * (Math.round(this.angleFull / 45));

        if (this.angleFull >= 45 && this.angleFull < 135)
        {
            this.quadrant = 1;
        }
        else if (this.angleFull >= 135 && this.angleFull < 225)
        {
            this.quadrant = 2;
        }
        else if (this.angleFull >= 225 && this.angleFull < 315)
        {
            this.quadrant = 3;
        }
        else
        {
            this.quadrant = 0;
        }

    },

    /**
     * The Input.onMove callback. Processes the movement event for this stick.
     *
     * @method Phaser.VirtualJoystick.Stick#moveStick
     * @private
     */
    moveStick: function () {

        if (!this.pointer || (!this.isDown && !this._tracking))
        {
            return;
        }

        if (this.motionLock === Phaser.VirtualJoystick.NONE)
        {
            this.line.end.copyFrom(this.pointer);
        }
        else if (this.motionLock === Phaser.VirtualJoystick.HORIZONTAL)
        {
            this.line.end.x = this.pointer.x;
        }
        else if (this.motionLock === Phaser.VirtualJoystick.VERTICAL)
        {
            this.line.end.y = this.pointer.y;
        }

        this.checkArea();

        if (!this.isDown && this.line.length <= this.deadZone)
        {
            return;
        }

        if (this._tracking)
        {
            //  Was tracking, now in the zone so dispatch and follow
            this.setDown();
        }

        if (this.line.length < this.baseHitArea.radius)
        {
            if (this.motionLock === Phaser.VirtualJoystick.NONE)
            {
                this.stickHitArea.x = this.pointer.x;
                this.stickHitArea.y = this.pointer.y;
            }
            else if (this.motionLock === Phaser.VirtualJoystick.HORIZONTAL)
            {
                this.stickHitArea.x = this.pointer.x;
            }
            else if (this.motionLock === Phaser.VirtualJoystick.VERTICAL)
            {
                this.stickHitArea.y = this.pointer.y;
            }
        }
        else
        {
            //  Let it smoothly rotate around the base limit
            this.baseHitArea.circumferencePoint(this.line.angle, false, this.limitPoint);

            if (this.motionLock === Phaser.VirtualJoystick.NONE)
            {
                this.stickHitArea.x = this.limitPoint.x;
                this.stickHitArea.y = this.limitPoint.y;
            }
            else if (this.motionLock === Phaser.VirtualJoystick.HORIZONTAL)
            {
                this.stickHitArea.x = this.limitPoint.x;
            }
            else if (this.motionLock === Phaser.VirtualJoystick.VERTICAL)
            {
                this.stickHitArea.y = this.limitPoint.y;
            }
        }

        this.stickSprite.x = this.stickHitArea.x;
        this.stickSprite.y = this.stickHitArea.y;

        this.onMove.dispatch(this, this.force, this.forceX, this.forceY);

    },

    /**
     * The update callback. This is called automatically by the Pad parent.
     *
     * @method Phaser.VirtualJoystick.Stick#update
     * @private
     */
    update: function () {

        if (this.isDown && !this._tracking)
        {
            this.onUpdate.dispatch(this, this.force, this.forceX, this.forceY);
        }

    },

    /**
     * Visually aligns the joystick to the bottom left of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the joystick.
     *
     * @method Phaser.VirtualJoystick.Stick#alignBottomLeft
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the joystick.
     */
    alignBottomLeft: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.baseSprite.width / 2) + spacing;
        var h = (this.baseSprite.height / 2) + spacing;

        this.posX = w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Visually aligns the joystick to the bottom right of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the joystick.
     *
     * @method Phaser.VirtualJoystick.Stick#alignBottomRight
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the joystick.
     */
    alignBottomRight: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.baseSprite.width / 2) + spacing;
        var h = (this.baseSprite.height / 2) + spacing;

        this.posX = this.pad.game.width - w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Destroys this Stick.
     * 
     * Removes all associated event listeners and signals and calls destroy on the stick sprites.
     *
     * @method Phaser.VirtualJoystick.Stick#destroy
     */
    destroy: function () {

        this.pad.game.input.onDown.remove(this.checkDown, this);
        this.pad.game.input.onUp.remove(this.checkUp, this);

        var mc = this.pad.game.input.moveCallbacks;

        for (var i = 0; i < mc.length; i++)
        {
            if (mc.callback === this.moveStick && mc.context === this)
            {
                mc.splice(i, 1);
                break;
            }
        }

        this.stickSprite.destroy();
        this.baseSprite.destroy();

        this.stickHitArea = null;
        this.baseHitArea = null;
        this.line = null;
        this.limitPoint = null;

        this.onDown.dispose();
        this.onUp.dispose();
        this.onMove.dispose();
        this.onUpdate.dispose();

        this.pointer = null;

        this._scale = null;
        this.pad = null;

    },

    /**
     * Renders out a debug view of this Stick to the `Phaser.Debug` handler.
     *
     * It optionally renders the geometry involved in the stick hit areas and calculation line.
     * 
     * It also optionally renders text information relating to the current forces and angles. The text is rendered
     * to the right of the joystick image unless an x parameter is specified.
     *
     * Because of the overhead of using Phaser.Debug in WebGL mode you should never enable this in a production game.
     * However for debugging it's extremely useful, hence why it's named `debug`.
     *
     * @method Phaser.VirtualJoystick.Stick#debug
     * @param {boolean} [sticks=true] - Renders the geometry involved in the stick hit areas and calculation line.
     * @param {boolean} [text=true] - Renders text information relating to the current forces and angles.
     * @param {number} [x] - The x coordinate to render the text properties to. If not given will default to the right of the joystick.
     */
    debug: function (sticks, text, x) {

        if (typeof sticks === 'undefined') { sticks = true; }
        if (typeof text === 'undefined') { text = true; }
        if (typeof x === 'undefined') { x = this.baseSprite.right; }

        var debug = this.pad.game.debug;

        if (sticks)
        {
            debug.context.lineWidth = 2;
            debug.geom(this.baseHitArea, 'rgba(255, 0, 0, 1)', false);
            debug.geom(this.stickHitArea, 'rgba(0, 255, 0, 1)', false);
            debug.geom(this.line, 'rgba(255, 255, 0, 1)');
            debug.context.lineWidth = 1;
        }

        if (text)
        {
            var shadow = debug.renderShadow;
            var tx = x;
            var ty = this.baseSprite.y - 114;

            debug.renderShadow = true;

            debug.text('Force: ' + this.force.toFixed(2), tx, ty);
            debug.text('ForceX: ' + this.forceX.toFixed(2), tx, ty + 24);
            debug.text('ForceY: ' + this.forceY.toFixed(2), tx, ty + 48);
            debug.text('Rotation: ' + this.rotation.toFixed(2), tx, ty + 96);
            debug.text('Angle: ' + this.angle.toFixed(2), tx, ty + 120);
            debug.text('Distance: ' + this.distance, tx, ty + 172);
            debug.text('Quadrant: ' + this.quadrant, tx, ty + 196);
            debug.text('Octant: ' + this.octant, tx, ty + 220);

            debug.renderShadow = shadow;
        }

    }

};

/**
* @name Phaser.VirtualJoystick.Stick#rotation
* @property {number} rotation - The rotation of the stick from its base in radians.
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "rotation", {

    get: function () {

        return this.line.angle;

    }

});

/**
* The x coordinate the joystick is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the joystick on-screen. Value can even be tweened to display or hide the joystick in interesting ways.
* 
* @name Phaser.VirtualJoystick.Stick#posX
* @property {number} posX
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "posX", {

    get: function () {

        return this.position.x;

    },

    set: function (x) {

        if (this.position.x !== x)
        {
            this.position.x = x;

            this.baseSprite.x = x;
            this.stickSprite.x = x;

            this.baseHitArea.x = x;
            this.stickHitArea.x = x;
            this.line.start.x = x;
            this.line.end.x = x;
        }

    }

});

/**
* The y coordinate the joystick is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the joystick on-screen. Value can even be tweened to display or hide the joystick in interesting ways.
* 
* @name Phaser.VirtualJoystick.Stick#posY
* @property {number} posY
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "posY", {

    get: function () {

        return this.position.y;

    },

    set: function (y) {

        if (this.position.y !== y)
        {
            this.position.y = y;

            this.baseSprite.y = y;
            this.stickSprite.y = y;

            this.baseHitArea.y = y;
            this.stickHitArea.y = y;
            this.line.start.y = y;
            this.line.end.y = y;
        }

    }

});

/**
* The current force being applied to the joystick.
* 
* This is a value between 0 and 1 calculated based on the distance of the stick from its base.
* It can be used to apply speed to physics objects, for example:
* 
* `ArcadePhysics.velocityFromRotation(Stick.rotation, Stick.force * maxSpeed, Sprite.body.velocity)`
* 
* @name Phaser.VirtualJoystick.Stick#force
* @property {number} force
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "force", {

    get: function () {

        return Math.min(1, (this.line.length / this.distance * 2));

    }

});

/**
* The current force being applied to the joystick on the horizontal axis.
* 
* This is a value between 0 and 1 calculated based on the distance of the stick from its base.
*
* If you need to know which direction the Stick is facing (i.e. left or right) then see the `x` property value.
* 
* @name Phaser.VirtualJoystick.Stick#forceX
* @property {number} forceX
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "forceX", {

    get: function () {

        return this.force * this.x;

    }

});

/**
* The current force being applied to the joystick on the vertical axis.
* 
* This is a value between 0 and 1 calculated based on the distance of the stick from its base.
*
* If you need to know which direction the Stick is facing (i.e. up or down) then see the `y` property value.
* 
* @name Phaser.VirtualJoystick.Stick#forceY
* @property {number} forceY
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "forceY", {

    get: function () {

        return this.force * this.y;

    }

});

/**
* The current x value of the joystick.
* 
* This is a value between -1 and 1 calculated based on the distance of the stick from its base.
* Where -1 is to the left of the base and +1 is to the right.
* 
* @name Phaser.VirtualJoystick.Stick#x
* @property {number} x
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "x", {

    get: function () {

        if (this.line.angle >= 0)
        {
            if (this.line.angle <= 1.5707963267948966)
            {
                //   Bottom right (0 - 90)
                return (1.5707963267948966 - this.line.angle) / 1.5707963267948966;
            }
            else
            {
                //   Bottom left (90 - 180)
                return -1 + (((3.141592653589793 - this.line.angle) / 3.141592653589793) * 2);
            }
        }
        else
        {
            if (this.line.angle >= -1.5707963267948966)
            {
                //   Top right (0 to -90)
                return (Math.abs(-1.5707963267948966 - this.line.angle)) / 1.5707963267948966;
            }
            else
            {
                //   Top left (-90 to -180)
                return -1 + ((Math.abs(-3.141592653589793 - this.line.angle) / 3.141592653589793) * 2);
            }
        }

    }

});

/**
* The current y value of the joystick.
* 
* This is a value between -1 and 1 calculated based on the distance of the stick from its base.
* Where -1 is above the base and +1 is below the base.
* 
* @name Phaser.VirtualJoystick.Stick#y
* @property {number} y
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "y", {

    get: function () {

        if (this.line.angle >= 0)
        {
            //  Down
            return 1 - (Math.abs(1.5707963267948966 - this.line.angle) / 1.5707963267948966);
        }
        else
        {
            //  Up
            return -1 + (Math.abs(-1.5707963267948966 - this.line.angle) / 1.5707963267948966);
        }

    }

});

/**
* The filterX value is the forceX value adjusted to be used as the mouse input uniform for a filter.
* 
* This is a value between 0 and 1 where 0.5 is the center, i.e. the stick un-moved from its base.
*
* Use it in the update method like so:
*
* `filter.uniforms.mouse.value.x = this.stick.filterX;`
* `filter.uniforms.mouse.value.y = this.stick.filterY;`
* `filter.update();`
* 
* @name Phaser.VirtualJoystick.Stick#filterX
* @property {number} filterX
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "filterX", {

    get: function () {

        if (this.x === 0)
        {
            return 0.50;
        }
        else
        {
            var fx = Math.abs(this.forceX) / 2;

            if (this.x < 0)
            {
                return (0.5 - fx).toFixed(2);
            }
            else
            {
                return (0.5 + fx).toFixed(2);
            }
        }

    }

});

/**
* The filterY value is the forceY value adjusted to be used as the mouse input uniform for a filter.
* 
* This is a value between 0 and 1 where 0.5 is the center, i.e. the stick un-moved from its base.
*
* Use it in the update method like so:
*
* `filter.uniforms.mouse.value.x = this.stick.filterX;`
* `filter.uniforms.mouse.value.y = this.stick.filterY;`
* `filter.update();`
* 
* @name Phaser.VirtualJoystick.Stick#filterY
* @property {number} filterY
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "filterY", {

    get: function () {

        if (this.y === 0)
        {
            return 0.50;
        }
        else
        {
            var fy = Math.abs(this.forceY) / 2;

            if (this.y < 0)
            {
                return 1 - (0.5 - fy).toFixed(2);
            }
            else
            {
                return 1 - (0.5 + fy).toFixed(2);
            }
        }

    }

});

/**
* The alpha value of the Stick.
* 
* Adjusting this value changes the alpha property of both the base and stick sprites.
* Reading it reads the alpha value of the stick sprite alone.
*
* If you need to give the base and stick sprites *different* alpha values then you can access them directly:
*
* `stick.baseSprite.alpha` and `stick.stickSprite.alpha`.
* 
* @name Phaser.VirtualJoystick.Stick#alpha
* @property {number} alpha
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "alpha", {

    get: function () {

        return this.stickSprite.alpha;

    },

    set: function (value) {

        this.stickSprite.alpha = value;
        this.baseSprite.alpha = value;

    }

});

/**
* The visible state of the Stick.
* 
* Adjusting this value changes the visible property of both the base and stick sprites.
* Reading it reads the visible value of the stick sprite alone.
*
* Note that this stick will carry on processing and dispatching events even when not visible.
* If you wish to disable the stick from processing events see `Stick.enabled`.
*
* If you need to give the base and stick sprites *different* visible values then you can access them directly:
*
* `stick.baseSprite.visible` and `stick.stickSprite.visible`.
* 
* @name Phaser.VirtualJoystick.Stick#visible
* @property {number} visible
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "visible", {

    get: function () {

        return this.stickSprite.visible;

    },

    set: function (value) {

        this.stickSprite.visible = value;
        this.baseSprite.visible = value;

    }

});

/**
* The distance in pixels that the stick needs to move from the base before it's at 'full force'.
* 
* This value is adjusted for scale.
* 
* It should never be less than the `Stick.deadZone` value.
* 
* @name Phaser.VirtualJoystick.Stick#distance
* @property {number} distance
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "distance", {

    get: function () {

        return this._distance * this._scale;

    },

    set: function (value) {

        if (this._distance !== value)
        {
            this._distance = value;
        }

    }

});

/**
* The dead zone is a distance in pixels within which the Stick isn't considered as down or moving.
* Only when it moves beyond this value does it start dispatching events.
* 
* By default the deadZone is 15% of the given distance value. 
* So if the distance is 100 pixels then the Stick won't be considered as active until it has moved at least 15 pixels from its base.
* 
* This value is adjusted for scale.
* 
* It should never be more than the `Stick.distance` value.
* 
* @name Phaser.VirtualJoystick.Stick#deadZone
* @property {number} deadZone
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "deadZone", {

    get: function () {

        return this._deadZone * this._scale;

    },

    set: function (value) {

        this._deadZone = value;

    }

});

/**
* The scale of the Stick. The scale is applied evenly to both the x and y axis of the Stick.
* You cannot specify a different scale per axis.
* 
* Adjusting this value changes the scale of both the base and stick sprites and recalculates all of the hit areas.
*
* The base and stick sprites must have the same scale.
* 
* @name Phaser.VirtualJoystick.Stick#scale
* @property {number} scale
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "scale", {

    get: function () {

        return this._scale;

    },

    set: function (value) {

        if (this._scale !== value)
        {
            this.stickSprite.scale.set(value);
            this.baseSprite.scale.set(value);

            this.baseHitArea.setTo(this.position.x, this.position.y, this.distance * value);
            this.stickHitArea.setTo(this.position.x, this.position.y, this.stickSprite.width);

            this._scale = value;
        }

    }

});

/**
* A Stick that is set to `showOnTouch` will have `visible` set to false until the player presses on the screen.
* When this happens the Stick is centered on the x/y coordinate of the finger and can be immediately dragged for movement.
* 
* @name Phaser.VirtualJoystick.Stick#showOnTouch
* @property {boolean} showOnTouch
*/
Object.defineProperty(Phaser.VirtualJoystick.Stick.prototype, "showOnTouch", {

    get: function () {

        return this._showOnTouch;

    },

    set: function (value) {

        if (this._showOnTouch !== value)
        {
            this._showOnTouch = value;

            if (this._showOnTouch && this.visible)
            {
                this.visible = false;
            }
        }

    }

});
