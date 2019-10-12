//TODO: Consider to move this somewhere else or refactor the code that uses it
Function.prototype.extend = function(a) {
  this.prototype = Object.create(a.prototype);
  this.prototype.constructor = this;
  return this;
};

let Game = {
  _display: null, // ESTOS DOS OBJETOS SON PRIVADOS, SE SUPONE (_) QUIZA HACERLOS PRIVADOS DE VERDAD?
  _currentScreen: null,
  _screenWidth: 80,
  _screenHeight: 24,
  init: function() {
    // Any necessary initialization will go here.
    this._display = new ROT.Display({
      width: this._screenWidth,
      height: this._screenHeight
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
          // Clear the screen
          game._display.clear();
          // Render the screen
          game._currentScreen.render(game._display);
        }
      });
    };
    // Bind keyboard input events
    bindEventToScreen("keydown");
    //bindEventToScreen('keyup');
    //bindEventToScreen('keypress');
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
      this._currentScreen.render(this._display);
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
