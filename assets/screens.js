Game.Screen = {};

// Define our initial start screen
Game.Screen.startScreen = {
  enter: function() {
    console.log("Entered start screen.");
  },
  exit: function() {
    console.log("Exited start screen.");
  },
  render: function(display) {
    // Render our prompt to the screen
    display.drawText(1, 1, "%c{yellow}Javascript Roguelike");
    display.drawText(1, 2, "Press [Enter] to start!");
  },
  handleInput: function(inputType, inputData) {
    // When [Enter] is pressed, go to the play screen
    if (inputType === "keydown") {
      if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
        Game.switchScreen(Game.Screen.playScreen);
      }
    }
  }
};

// Define our playing screen
Game.Screen.playScreen = {
  _map: null,
  _player: null,
  enter: function() {
    // Create a map based on our size parameters
    const width = 100;
    const height = 48;
    const depth = 6;
    // Create our map from the tiles and player
    const tiles = new Game.Builder(width, height, depth).getTiles();
    this._player = new Game.Entity(Game.PlayerTemplate);
    this._map = new Game.Map(tiles, this._player);
    //this._map = new Game.Map(map, this._player);
    // Start the map's engine
    console.log(this._map);
    this._map.getEngine().start();
  },
  move: function(dX, dY, dZ) {
    const newX = this._player.getX() + dX;
    const newY = this._player.getY() + dY;
    const newZ = this._player.getZ() + dZ;
    // Try to move to the new cell
    this._player.tryMove(newX, newY, newZ, this._map);
  },
  exit: function() {
    console.log("Exited play screen.");
  },
  render: function(display) {
    const screenWidth = Game.getScreenWidth();
    const screenHeight = Game.getScreenHeight();
    // Make sure the x-axis doesn't go to the left of the left bound
    let topLeftX = Math.max(0, this._player.getX() - screenWidth / 2);
    // Make sure we still have enough space to fit an entire game screen
    topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
    // Make sure the y-axis doesn't above the top bound
    let topLeftY = Math.max(0, this._player.getY() - screenHeight / 2);
    // Make sure we still have enough space to fit an entire game screen
    topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
    // Iterate through all visible map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        // Fetch the glyph for the tile and render it to the screen
        // at the offset position.
        const tile = this._map.getTile(x, y, this._player.getZ());
        display.draw(
          x - topLeftX,
          y - topLeftY,
          tile.getChar(),
          tile.getForeground(),
          tile.getBackground()
        );
      }
    }
    // Render the player
    display.draw(
      this._player.getX() - topLeftX,
      this._player.getY() - topLeftY,
      this._player.getChar(),
      this._player.getForeground(),
      this._player.getBackground()
    );
    // Render the entities
    var entities = this._map.getEntities();
    for (let i = 0; i < entities.length; i++) {
      var entity = entities[i];
      // Only render the entitiy if they would show up on the screen
      if (
        entity.getX() >= topLeftX &&
        entity.getY() >= topLeftY &&
        entity.getX() < topLeftX + screenWidth &&
        entity.getY() < topLeftY + screenHeight &&
        entity.getZ() == this._player.getZ()
      ) {
        display.draw(
          entity.getX() - topLeftX,
          entity.getY() - topLeftY,
          entity.getChar(),
          entity.getForeground(),
          entity.getBackground()
        );
      }
    }
    // Get the messages in the player's queue and render them
    const messages = this._player.getMessages();
    let messageY = 0;
    for (let i = 0; i < messages.length; i++) {
      // Draw each message, adding the number of lines
      messageY += display.drawText(
        0,
        messageY,
        "%c{white}%b{black}" + messages[i]
      );
    }
    // Render player HP
    let statsFormat = "%c{white}%b{black}";
    const statsLine = statsFormat.concat(
      vsprintf("HP: %d/%d ", [this._player.getHp(), this._player.getMaxHp()]),
      vsprintf("Dungeon level: %d", this._player.getZ() + 1)
    );
    display.drawText(0, screenHeight, statsLine);
  },
  handleInput: function(inputType, inputData) {
    if (inputType === "keydown") {
      // If enter is pressed, go to the win screen
      // If escape is pressed, go to lose screen
      if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
        Game.switchScreen(Game.Screen.winScreen);
      } else if (inputData.keyCode === ROT.KEYS.VK_ESCAPE) {
        Game.switchScreen(Game.Screen.loseScreen);
      } else {
        // Movement
        if (
          inputData.keyCode === ROT.KEYS.VK_LEFT ||
          inputData.keyCode === ROT.KEYS.VK_NUMPAD4
        ) {
          this.move(-1, 0, 0);
        } else if (
          inputData.keyCode === ROT.KEYS.VK_RIGHT ||
          inputData.keyCode === ROT.KEYS.VK_NUMPAD6
        ) {
          this.move(1, 0, 0);
        } else if (
          inputData.keyCode === ROT.KEYS.VK_UP ||
          inputData.keyCode === ROT.KEYS.VK_NUMPAD8
        ) {
          this.move(0, -1, 0);
        } else if (
          inputData.keyCode === ROT.KEYS.VK_DOWN ||
          inputData.keyCode === ROT.KEYS.VK_NUMPAD2
        ) {
          this.move(0, 1, 0);
        } else if (inputData.keyCode === ROT.KEYS.VK_NUMPAD1) {
          this.move(-1, 1, 0);
        } else if (inputData.keyCode === ROT.KEYS.VK_NUMPAD3) {
          this.move(1, 1, 0);
        } else if (inputData.keyCode === ROT.KEYS.VK_NUMPAD7) {
          this.move(-1, -1, 0);
        } else if (inputData.keyCode === ROT.KEYS.VK_NUMPAD9) {
          this.move(1, -1, 0);
        }
        // Unlock the engine
        this._map.getEngine().unlock();
      }
    } else if (inputType === "keypress") {
      const keyChar = String.fromCharCode(inputData.charCode);
      if (keyChar === ">") {
        this.move(0, 0, 1);
      } else if (keyChar === "<") {
        this.move(0, 0, -1);
      } else {
        // Not a valid key
        return;
      }
      // Unlock the engine
      this._map.getEngine().unlock();
    }
  }
};
// Define our winning screen
Game.Screen.winScreen = {
  enter: function() {
    console.log("Entered win screen.");
  },
  exit: function() {
    console.log("Exited win screen.");
  },
  render: function(display) {
    // Render our prompt to the screen
    for (let i = 0; i < 22; i++) {
      // Generate random background colors
      let r = Math.round(Math.random() * 255);
      let g = Math.round(Math.random() * 255);
      let b = Math.round(Math.random() * 255);
      let background = ROT.Color.toRGB([r, g, b]);
      display.drawText(2, i + 1, "%b{" + background + "}You win!");
    }
  },
  handleInput: function(inputType, inputData) {
    // Nothing to do here
  }
};

// Define our losing screen
Game.Screen.loseScreen = {
  enter: function() {
    console.log("Entered lose screen.");
  },
  exit: function() {
    console.log("Exited lose screen.");
  },
  render: function(display) {
    // Render our prompt to the screen
    for (let i = 0; i < 22; i++) {
      display.drawText(2, i + 1, "%b{red}You lose! :(");
    }
  },
  handleInput: function(inputType, inputData) {
    // Nothing to do here
  }
};
