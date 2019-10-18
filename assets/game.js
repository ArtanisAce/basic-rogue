//TODO: Consider to move this somewhere else or refactor the code that uses it
Function.prototype.extend = function(a) {
  this.prototype = Object.create(a.prototype);
  this.prototype.constructor = this;
  return this;
};

Array.prototype.random=function(){return!this.length?null:this[Math.floor(ROT.RNG.getUniform()*this.length)]};

Array.prototype.randomize = function() {
  for(var a=[];this.length;){
    var b=this.indexOf(this.random());
    a.push(this.splice(b,1)[0])}
    return a};

let Game = {
  _display: null, // ESTOS DOS OBJETOS SON PRIVADOS, SE SUPONE (_) QUIZA HACERLOS PRIVADOS DE VERDAD?
  _currentScreen: null,
  _screenWidth: 80,
  _screenHeight: 24,
  init: function() {
    // Any necessary initialization will go here.
    this._display = new ROT.Display({
      width: this._screenWidth,
      height: this._screenHeight + 1 // Line to show messages
    });
    // Create a helper function for binding to an event
    // and making it send it to the screen
    let game = this; // So that we don't lose this
    const bindEventToScreen = function(event) {
      window.addEventListener(event, function(e) {
        // When an event is received, send it to the
        // screen if there is one
        if (game._currentScreen !== null) {
          // Send the event type and data to the screen
          game._currentScreen.handleInput(event, e);
        }
      });
    };
    // Bind keyboard input events
    bindEventToScreen("keydown");
    bindEventToScreen("keypress");
  },
  refresh: function() {
    // Clear the screen
    this._display.clear();
    // Render the screen
    this._currentScreen.render(this._display);
  },
  getDisplay: function() {
    return this._display;
  },
  getScreenWidth: function() {
    return this._screenWidth;
  },
  getScreenHeight: function() {
    return this._screenHeight;
  },
  switchScreen: function(screen) {
    // If we had a screen before, notify it that we exited
    if (this._currentScreen !== null) {
      this._currentScreen.exit();
    }
    // Clear the display
    this.getDisplay().clear();
    // Update our current screen, notify it we entered
    // and then render it
    this._currentScreen = screen;
    if (this._currentScreen) {
      this._currentScreen.enter();
      this.refresh();
    }
  }
};

window.onload = function() {
  // Initialize the game
  Game.init();
  // Add the container to our HTML page
  document.body.appendChild(Game.getDisplay().getContainer());
  // Load the start screen
  Game.switchScreen(Game.Screen.startScreen);
};
