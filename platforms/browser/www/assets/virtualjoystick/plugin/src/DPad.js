/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
 * A `DPad` is a virtual joystick. It belongs to a parent `Pad` object which is responsible for creating and updating it.
 *
 * Create a new dpad by using the `Pad.addDPad` method.
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
 * @class Phaser.VirtualJoystick.DPad
 * @constructor
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
 */
Phaser.VirtualJoystick.DPad = function (pad, x, y, distance, texture, neutralFrame, upFrame, downFrame, leftFrame, rightFrame) {

    /**
    * @property {Phaser.VirtualJoystick.Pad} pad - A reference to the Virtual Pad that this Joystick belongs to.
    */
    this.pad = pad;

    /**
    * @property {string} neutralFrame - The name of the frame within the texture atlas that contains the 'neutral' state of the dpad. Neutral is the state when the dpad isn't moved at all.
    */
    this.neutralFrame = neutralFrame;

    /**
    * @property {string} upFrame - The name of the frame within the texture atlas that contains the 'up' state of the dpad.
    */
    this.upFrame = upFrame;

    /**
    * @property {string} downFrame - The name of the frame within the texture atlas that contains the 'down' state of the dpad.
    */
    this.downFrame = downFrame;

    /**
    * @property {string} leftFrame - The name of the frame within the texture atlas that contains the 'left' state of the dpad.
    */
    this.leftFrame = leftFrame;

    /**
    * @property {string} rightFrame - The name of the frame within the texture atlas that contains the 'right' state of the dpad.
    */
    this.rightFrame = rightFrame;

    /**
    * @property {Phaser.Point} position - The position of the dpad in screen coordinates. To adjust please use `posX` and `posY`.
    * @protected
    */
    this.position = new Phaser.Point(x, y);

    /**
    * @property {Phaser.Line} line - The line object used for stick to base calculations.
    * @protected
    */
    this.line = new Phaser.Line(this.position.x, this.position.y, this.position.x, this.position.y);

    /**
    * @property {Phaser.Sprite} sprite - The Sprite that is used to display the dpad.
    */
    this.sprite = this.pad.game.make.sprite(x, y, texture, neutralFrame);
    this.sprite.anchor.set(0.5);

    /**
    * @property {Phaser.Circle} baseHitArea - The circular hit area that defines the base of the dpad.
    */
    this.baseHitArea = new Phaser.Circle(this.position.x, this.position.y, distance);

    /**
    * @property {Phaser.Circle} stickHitArea - The circular hit area that defines the stick or handle of the dpad.
    */
    this.stickHitArea = new Phaser.Circle(this.position.x, this.position.y, this.sprite.width);

    /**
    * @property {Phaser.Point} limitPoint - A Point object that holds the stick limits.
    * @protected
    */
    this.limitPoint = new Phaser.Point();

    /**
    * @property {Phaser.Pointer} pointer - A reference to the Input Pointer being used to update this dpad.
    * @protected
    */
    this.pointer = null;

    /**
    * @property {boolean} enabled - Should this dpad process or dispatch any events? Set to `false` to disable it.
    * @default
    */
    this.enabled = true;

    /**
    * The current down state of this dpad. A dpad is determined as being down if it has been pressed and interacted with.
    * If it has a `deadZone` set then it's not considered as being down unless it has moved beyond the limits of the deadZone.
    * @property {boolean} isDown
    * @protected
    */
    this.isDown = false;

    /**
    * The current up state of this dpad. A dpad is determined as being up if it is not being interacted with.
    * If it has a `deadZone` set then it's considered as being up until it has moved beyond the limits of the deadZone.
    * @property {boolean} isUp
    * @protected
    */
    this.isUp = true;

    /**
    * The onDown signal is dispatched as soon as the dpad is touched, or clicked when under mouse emulation.
    * If it has a `deadZone` set then it's not dispatched until it has moved beyond the limits of the deadZone.
    * When this signal is dispatched it sends 2 parameters: this DPad and the Phaser.Pointer object that caused the event:
    * `onDown(Phaser.VirtualJoystick.DPad, Phaser.Pointer)`
    * 
    * @property {Phaser.Signal} onDown
    */
    this.onDown = new Phaser.Signal();

    /**
    * The onUp signal is dispatched as soon as the dpad is released, having previously been in an `isDown` state.
    * When this signal is dispatched it sends 2 parameters: this DPad and the Phaser.Pointer object that caused the event:
    * `onUp(Phaser.VirtualJoystick.DPad, Phaser.Pointer)`
    * 
    * @property {Phaser.Signal} onUp
    */
    this.onUp = new Phaser.Signal();

    /**
    * The onMove signal is dispatched whenever the dpad is moved as a result of a device Touch movement event.
    * When this signal is dispatched it sends 3 parameters: this DPad and the `x` and `y` values:
    * `onMove(Phaser.VirtualJoystick.DPad, x, y)`
    * This signal is only dispatched when a touch move event is received, even if the dpad is held down in a specific direction.
    * If you wish to constantly check the position of the dpad then you should use the `onUpdate` signal instead of `onMove`.
    * 
    * @property {Phaser.Signal} onMove
    */
    this.onMove = new Phaser.Signal();

    /**
    * The onUpdate signal is dispatched constantly for as long as the dpad is in an `isDown` state.
    * When this signal is dispatched it sends 3 parameters: this DPad and the `x` and `y` values:
    * `onUpdate(Phaser.VirtualJoystick.DPad, x, y)`
    * This is a high frequency signal so be careful what is bound to it. If there are computationally cheaper ways of 
    * reacting to this dpads movement then you should explore them (such as polling DPad.x/y within an update loop)
    * 
    * @property {Phaser.Signal} onUpdate
    */
    this.onUpdate = new Phaser.Signal();

    /**
    * @property {integer} timeDown - The time when the dpad last entered an `isDown` state.
    * @readOnly
    */
    this.timeDown = 0;

    /**
    * @property {integer} timeUp - The time when the dpad last entered an `isUp` state.
    * @readOnly
    */
    this.timeUp = 0;

    /**
    * @property {number} angle - The angle of the dpad in degrees. From -180 to 180 where zero is right-handed.
    * @readOnly
    */
    this.angle = 0;

    /**
    * @property {number} angleFull - The angle of the dpad in degrees. From 0 to 360 where zero is right-handed.
    * @readOnly
    */
    this.angleFull = 0;

    /**
    * The quadrant the dpad is in.
    * Where 315 to 45 degrees is quadrant 0. 
    * 45 to 135 degrees is quadrant 1. 
    * 135 to 225 degrees is quadrant 2.
    * 225 to 315 degrees is quadrant 3.
    * @property {integer} quadrant
    * @readOnly
    */
    this.quadrant = 0;

    /**
    * The nearest octant of the dpad. Where each octant is 360 degrees / 45.
    * @property {integer} octant
    * @readOnly
    */
    this.octant = 0;

    /**
    * The direction the dpad is currently pushed. 
    * If not touched it's Phaser.NONE, otherwise one of Phaser.LEFT, Phaser.RIGHT, Phaser.UP or Phaser.DOWN.
    * @property {integer} direction
    * @protected
    */
    this.direction = Phaser.NONE;

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

    this.pad.game.stage.addChild(this.sprite);

    this.pad.game.input.onDown.add(this.checkDown, this);
    this.pad.game.input.onUp.add(this.checkUp, this);
    this.pad.game.input.addMoveCallback(this.moveStick, this);

};

Phaser.VirtualJoystick.DPad.prototype = {

    /**
     * The Input.onDown callback. Processes the down event for this dpad, or starts tracking if required.
     *
     * @method Phaser.VirtualJoystick.DPad#checkDown
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkDown: function (pointer) {

        if (this.enabled && this.isUp)
        {
            this.pointer = pointer;

            this.line.end.copyFrom(pointer);

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
     * The Input.onUp callback. Processes the up event for this dpad.
     *
     * @method Phaser.VirtualJoystick.DPad#checkUp
     * @private
     * @param {Phaser.Pointer} pointer - The Phaser Pointer that triggered the event.
     */
    checkUp: function (pointer) {

        if (pointer === this.pointer)
        {
            this.pointer = null;

            this.stickHitArea.x = this.position.x;
            this.stickHitArea.y = this.position.y;

            this.sprite.frameName = this.neutralFrame;

            this.line.end.copyFrom(this.line.start);

            this.isDown = false;
            this.isUp = true;
            this.direction = Phaser.NONE;

            this.timeUp = this.pad.game.time.time;

            this.onUp.dispatch(this, pointer);

            if (this._showOnTouch)
            {
                this.visible = false;
            }
        }

    },

    /**
     * Internal down handler. Activated either onDown or after tracking if the dpad has a dead zone.
     *
     * @method Phaser.VirtualJoystick.DPad#setDown
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
     * @method Phaser.VirtualJoystick.DPad#checkArea
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
     * The Input.onMove callback. Processes the movement event for this dpad.
     *
     * @method Phaser.VirtualJoystick.DPad#moveStick
     * @private
     */
    moveStick: function () {

        if (!this.pointer || (!this.isDown && !this._tracking))
        {
            this.direction = Phaser.NONE;
            this.sprite.frameName = this.neutralFrame;
            return;
        }

        this.line.end.copyFrom(this.pointer);

        this.checkArea();

        if (!this.isDown && this.line.length <= this.deadZone)
        {
            this.direction = Phaser.NONE;
            this.sprite.frameName = this.neutralFrame;
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

        if (this.quadrant === 1)
        {
            this.sprite.frameName = this.downFrame;
            this.direction = Phaser.DOWN;
        }
        else if (this.quadrant === 2)
        {
            this.sprite.frameName = this.leftFrame;
            this.direction = Phaser.LEFT;
        }
        else if (this.quadrant === 3)
        {
            this.sprite.frameName = this.upFrame;
            this.direction = Phaser.UP;
        }
        else
        {
            this.sprite.frameName = this.rightFrame;
            this.direction = Phaser.RIGHT;
        }

        this.onMove.dispatch(this, this.x, this.y);

    },

    /**
     * The update callback. This is called automatically by the Pad parent.
     *
     * @method Phaser.VirtualJoystick.DPad#update
     * @private
     */
    update: function () {

        if (this.isDown && !this._tracking)
        {
            this.onUpdate.dispatch(this, this.x, this.y);
        }

    },

    /**
     * Visually aligns the dpad to the bottom left of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the dpad.
     *
     * @method Phaser.VirtualJoystick.DPad#alignBottomLeft
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the dpad.
     */
    alignBottomLeft: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.sprite.width / 2) + spacing;
        var h = (this.sprite.height / 2) + spacing;

        this.posX = w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Visually aligns the dpad to the bottom right of the game view.
     * The optional spacing parameter allows you to add a border between the edge of the game and the dpad.
     *
     * @method Phaser.VirtualJoystick.DPad#alignBottomRight
     * @param {number} [spacing=0] - The spacing to apply between the edge of the game and the joystick.
     */
    alignBottomRight: function (spacing) {

        if (typeof spacing === 'undefined') { spacing = 0; }

        var w = (this.sprite.width / 2) + spacing;
        var h = (this.sprite.height / 2) + spacing;

        this.posX = this.pad.game.width - w;
        this.posY = this.pad.game.height - h;

    },

    /**
     * Destroys this dpad.
     * 
     * Removes all associated event listeners and signals and calls destroy on the dpad sprite.
     *
     * @method Phaser.VirtualJoystick.DPad#destroy
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

        this.sprite.destroy();

        this.stickHitArea = null;
        this.baseHitArea = null;
        this.line = null;
        this.limitPoint = null;

        this.onDown.dispose();
        this.onUp.dispose();

        this.pointer = null;

        this._scale = null;
        this.pad = null;

    },

    /**
     * Renders out a debug view of this DPad to the `Phaser.Debug` handler.
     *
     * It optionally renders the geometry involved in the dpad hit areas and calculation line.
     * 
     * It also optionally renders text information relating to the current forces and angles. The text is rendered
     * to the right of the dpad image unless an x parameter is specified.
     *
     * Because of the overhead of using Phaser.Debug in WebGL mode you should never enable this in a production game.
     * However for debugging it's extremely useful, hence why it's named `debug`.
     *
     * @method Phaser.VirtualJoystick.DPad#debug
     * @param {boolean} [sticks=true] - Renders the geometry involved in the stick hit areas and calculation line.
     * @param {boolean} [text=true] - Renders text information relating to the current forces and angles.
     * @param {number} [x] - The x coordinate to render the text properties to. If not given will default to the right of the joystick.
     */
    debug: function (sticks, text, x) {

        if (typeof sticks === 'undefined') { sticks = true; }
        if (typeof text === 'undefined') { text = true; }
        if (typeof x === 'undefined') { x = this.sprite.right; }

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
            var ty = this.sprite.y - 48;

            debug.renderShadow = true;

            debug.text('X: ' + this.x, tx, ty);
            debug.text('Y: ' + this.y, tx, ty + 24);
            debug.text('Distance: ' + this.distance, tx, ty + 48);
            debug.text('Quadrant: ' + this.quadrant, tx, ty + 96);
            debug.text('Octant: ' + this.octant, tx, ty + 120);

            debug.renderShadow = shadow;
        }

    }

};

/**
* The rotation of the stick from its base in radians.
* Even though a DPad is locked to one of 4 fixed directions the rotation will always be accurate to the radian.
* 
* @name Phaser.VirtualJoystick.DPad#rotation
* @property {number} rotation
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "rotation", {

    get: function () {

        return this.line.angle;

    }

});

/**
* The x coordinate the dpad is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the dpad on-screen. Value can even be tweened to display or hide the dpad in interesting ways.
* 
* @name Phaser.VirtualJoystick.DPad#posX
* @property {number} posX
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "posX", {

    get: function () {

        return this.position.x;

    },

    set: function (x) {

        if (this.position.x !== x)
        {
            this.position.x = x;

            this.sprite.x = x;

            this.baseHitArea.x = x;
            this.stickHitArea.x = x;
            this.line.start.x = x;
            this.line.end.x = x;
        }

    }

});

/**
* The y coordinate the dpad is rendered at. Value should be given in pixel coordinates based on game dimensions.
* Use this to change the position of the dpad on-screen. Value can even be tweened to display or hide the dpad in interesting ways.
* 
* @name Phaser.VirtualJoystick.DPad#posY
* @property {number} posY
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "posY", {

    get: function () {

        return this.position.y;

    },

    set: function (y) {

        if (this.position.y !== y)
        {
            this.position.y = y;

            this.sprite.y = y;

            this.baseHitArea.y = y;
            this.stickHitArea.y = y;
            this.line.start.y = y;
            this.line.end.y = y;
        }

    }

});

/**
* The current x value of the dpad.
*
* If the dpad is being held to the left it will return -1. If to the right it will return 1.
* If either not held at all, or not left or right, it will return 0.
* 
* @name Phaser.VirtualJoystick.DPad#x
* @property {number} x
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "x", {

    get: function () {

        if (this.direction === Phaser.LEFT)
        {
            return -1;
        }
        else if (this.direction === Phaser.RIGHT)
        {
            return 1;
        }
        else
        {
            return 0;
        }

    }

});

/**
* The current y value of the joystick.
* 
* If the dpad is being held up it will return -1. If down it will return 1.
* If either not held at all, or not up or down, it will return 0.
* 
* @name Phaser.VirtualJoystick.DPad#y
* @property {number} y
* @readOnly
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "y", {

    get: function () {

        if (this.direction === Phaser.UP)
        {
            return -1;
        }
        else if (this.direction === Phaser.DOWN)
        {
            return 1;
        }
        else
        {
            return 0;
        }

    }

});

/**
* The alpha value of the dpad.
* 
* Adjusting this value changes the alpha property of dpad sprite.
* 
* @name Phaser.VirtualJoystick.DPad#alpha
* @property {number} alpha
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "alpha", {

    get: function () {

        return this.sprite.alpha;

    },

    set: function (value) {

        this.sprite.alpha = value;

    }

});

/**
* The visible state of the dpad.
* 
* Adjusting this value changes the visible property of the dpad sprite.
*
* Note that this dpad will carry on processing and dispatching events even when not visible.
* If you wish to disable the dpad from processing events see `DPad.enabled`.
* 
* @name Phaser.VirtualJoystick.DPad#visible
* @property {number} visible
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "visible", {

    get: function () {

        return this.sprite.visible;

    },

    set: function (value) {

        this.sprite.visible = value;

    }

});

/**
* The distance in pixels that the player needs to move their finger from the base before it's at 'full force'.
* 
* This value is adjusted for scale.
* 
* It should never be less than the `DPad.deadZone` value.
* 
* @name Phaser.VirtualJoystick.DPad#distance
* @property {number} distance
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "distance", {

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
* The dead zone is a distance in pixels within which the dpad isn't considered as down or moving.
* Only when it moves beyond this value does it start dispatching events.
* 
* By default the deadZone is 15% of the given distance value. 
* So if the distance is 100 pixels then the dpad won't be considered as active until it has moved at least 15 pixels from its base.
* 
* This value is adjusted for scale.
* 
* It should never be more than the `DPad.distance` value.
* 
* @name Phaser.VirtualJoystick.DPad#deadZone
* @property {number} deadZone
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "deadZone", {

    get: function () {

        return this._deadZone * this._scale;

    },

    set: function (value) {

        this._deadZone = value;

    }

});

/**
* The scale of the dpad. The scale is applied evenly to both the x and y axis of the dpad.
* You cannot specify a different scale per axis.
* 
* Adjusting this value changes the scale of the base sprite and recalculates all of the hit areas.
* 
* @name Phaser.VirtualJoystick.DPad#scale
* @property {number} scale
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "scale", {

    get: function () {

        return this._scale;

    },

    set: function (value) {

        if (this._scale !== value)
        {
            this.sprite.scale.set(value);

            this.baseHitArea.setTo(this.position.x, this.position.y, this.distance * value);
            this.stickHitArea.setTo(this.position.x, this.position.y, this.sprite.width);

            this._scale = value;
        }

    }

});

/**
* A dpad that is set to `showOnTouch` will have `visible` set to false until the player presses on the screen.
* When this happens the dpad is centered on the x/y coordinate of the finger and can be immediately dragged for movement.
* 
* @name Phaser.VirtualJoystick.DPad#showOnTouch
* @property {boolean} showOnTouch
*/
Object.defineProperty(Phaser.VirtualJoystick.DPad.prototype, "showOnTouch", {

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
