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
    display.drawText(1, 1, "%c{yellow}Basic Rogue - Javascript Roguelike");
    display.drawText(1, 2, "created by Pedro Pablo Miron Pozo");
    display.drawText(1, 3, "Press [Enter] to start!");
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
  _gameEnded: false,
  _subScreen: null,
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
    // Render subscreen if there is one
    if (this._subScreen) {
      this._subScreen.render(display);
      return;
    }
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
    // Make sure we still have enough space to fit an entire game screen
    topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
    // This object will keep track of all visible map cells
    var visibleCells = {};
    // Store this._map and player's z to prevent losing it in callbacks
    var map = this._map;
    var currentDepth = this._player.getZ();
    // Find all visible cells and update the object
    map
      .getFov(currentDepth)
      .compute(
        this._player.getX(),
        this._player.getY(),
        this._player.getSightRadius(),
        function(x, y, radius, visibility) {
          visibleCells[x + "," + y] = true;
          // Mark cell as explored
          map.setExplored(x, y, currentDepth, true);
        }
      );
    // Iterate through all visible map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        if (visibleCells[x + "," + y]) {
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
    }
    // Render the explored map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        if (map.isExplored(x, y, currentDepth)) {
          // Fetch the glyph for the tile and render it to the screen
          // at the offset position.
          let glyph = this._map.getTile(x, y, currentDepth);
          let foreground = glyph.getForeground();
          // If we are at a cell that is in the field of vision, we need
          // to check if there are items or entities.
          if (visibleCells[x + "," + y]) {
            // Check for items first, since we want to draw entities
            // over items.
            const items = map.getItemsAt(x, y, currentDepth);
            // If we have items, we want to render the top most item
            if (items) {
              glyph = items[items.length - 1];
            }
            // Check if we have an entity at the position
            if (map.getEntityAt(x, y, currentDepth)) {
              glyph = map.getEntityAt(x, y, currentDepth);
            }
            // Update the foreground color in case our glyph changed
            foreground = glyph.getForeground();
          } else {
            // Since the tile was previously explored but is not
            // visible, we want to change the foreground color to
            // dark gray.
            foreground = "darkGray";
          }
          display.draw(
            x - topLeftX,
            y - topLeftY,
            glyph.getChar(),
            foreground,
            glyph.getBackground()
          );
        }
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
    // Render player and dungeon info
    let statsFormat = "%c{white}%b{black}";
    const statsLine = statsFormat.concat(
      vsprintf("HP: %d/%d | ", [this._player.getHp(), this._player.getMaxHp()]),
      vsprintf(this._player.getHungerState()),
      vsprintf(" | Dungeon level: %d", this._player.getZ() + 1)
    );
    display.drawText(0, screenHeight, statsLine);
  },
  handleInput: function(inputType, inputData) {
    // If the game is over, enter will bring the user to the losing screen.
    if (this._gameEnded) {
      if (inputType === "keydown" && inputData.keyCode === ROT.KEYS.VK_RETURN) {
        Game.switchScreen(Game.Screen.loseScreen);
      }
      // Return to make sure the user can't still play
      return;
    }
    // Handle subscreen input if there is one
    if (this._subScreen) {
      this._subScreen.handleInput(inputType, inputData);
      return;
    }
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
        } else if (inputData.keyCode === ROT.KEYS.VK_I) {
          // Show the inventory
          if (
            Game.Screen.inventoryScreen.setup(
              this._player,
              this._player.getItems()
            )
          ) {
            this.setSubScreen(Game.Screen.inventoryScreen);
          } else {
            Game.sendMessage(this._player, "You are not carrying anything!");
            Game.refresh();
          }
          return;
        } else if (inputData.keyCode === ROT.KEYS.VK_D) {
          // Show the drop screen
          if (
            Game.Screen.dropScreen.setup(this._player, this._player.getItems())
          ) {
            this.setSubScreen(Game.Screen.dropScreen);
          } else {
            Game.sendMessage(this._player, "You have nothing to drop!");
            Game.refresh();
          }
          return;
        } else if (inputData.keyCode === ROT.KEYS.VK_E) {
          // Show the drop screen
          if (
            Game.Screen.eatScreen.setup(this._player, this._player.getItems())
          ) {
            this.setSubScreen(Game.Screen.eatScreen);
          } else {
            Game.sendMessage(this._player, "You have nothing to eat!");
            Game.refresh();
          }
          return;
        } else if (inputData.keyCode === ROT.KEYS.VK_COMMA) {
          var items = this._map.getItemsAt(
            this._player.getX(),
            this._player.getY(),
            this._player.getZ()
          );
          // If there are no items, show a message
          if (!items) {
            Game.sendMessage(this._player, "There is nothing here to pick up.");
          } else if (items.length === 1) {
            // If only one item, try to pick it up
            var item = items[0];
            if (this._player.pickupItems([0])) {
              Game.sendMessage(this._player, "You pick up %s.", [
                item.describeA()
              ]);
            } else {
              Game.sendMessage(
                this._player,
                "Your inventory is full! Nothing was picked up."
              );
            }
          } else {
            // Show the pickup screen if there are any items
            Game.Screen.pickupScreen.setup(this._player, items);
            this.setSubScreen(Game.Screen.pickupScreen);
            return;
          }
        } else {
          // Not a valid key
          return;
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
  },
  setGameEnded: function(gameEnded) {
    this._gameEnded = gameEnded;
  },
  setSubScreen: function(subScreen) {
    this._subScreen = subScreen;
    // Refresh screen on changing the subscreen
    Game.refresh();
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

/* SUBSCREENS */

Game.Screen.ItemListScreen = function(template) {
  // Set up based on the template
  this._caption = template["caption"];
  this._okFunction = template["ok"];
  // By default, we use the identity function
  this._isAcceptableFunction =
    template["isAcceptable"] ||
    function(x) {
      return x;
    };
  // Whether the user can select items at all.
  this._canSelectItem = template["canSelect"];
  // Whether the user can select multiple items.
  this._canSelectMultipleItems = template["canSelectMultipleItems"];
};

Game.Screen.ItemListScreen.prototype.setup = function(player, items) {
  this._player = player;
  // Should be called before switching to the screen.
  let count = 0;
  // Iterate over each item, keeping only the aceptable ones and counting
  // the number of acceptable items.
  const that = this;
  //TODO: Refactorizar, no deberiamos devolver un array nuevo quizas para las subpantallas?
  // TODO: Seguro que el codigo este puede estar mas bonico
  this._items = items.map(function(item) {
    // Transform the item into null if it's not acceptable
    if (that._isAcceptableFunction(item)) {
      count++;
      return item;
    } else {
      return null;
    }
  });
  // Clean set of selected indices
  this._selectedIndices = {};
  return count;
};

Game.Screen.eatScreen = new Game.Screen.ItemListScreen({
  caption: "What do you want to eat?",
  canSelect: true,
  canSelectMultipleItems: false,
  isAcceptable: function(item) {
    return item && item.hasMixin("Edible");
  },
  ok: function(selectedItems) {
    // Eat the item, removing it if there are no consumptions remaining.
    const key = Object.keys(selectedItems)[0];
    const item = selectedItems[key];
    Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
    item.eat(this._player);
    if (!item.hasRemainingConsumptions()) {
      this._player.removeItem(key);
    }
    return true;
  }
});

Game.Screen.ItemListScreen.prototype.render = function(display) {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  // Render the caption in the top row
  display.drawText(0, 0, this._caption);
  let row = 0;
  for (let i = 0; i < this._items.length; i++) {
    // If we have an item, we want to render it.
    if (this._items[i]) {
      // Get the letter matching the item's index
      const letter = letters.substring(i, i + 1);
      // If we have selected an item, show a +, else show a dash between
      // the letter and the item's name.
      const selectionState =
        this._canSelectItem &&
        this._canSelectMultipleItems &&
        this._selectedIndices[i]
          ? "+"
          : "-";
      // Render at the correct row and add 2.
      display.drawText(
        0,
        2 + row,
        `${letter} ${selectionState} ${this._items[i].describe()}`
      );
      row++;
    }
  }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function() {
  // Gather the selected items.
  const selectedItems = {};
  for (const key in this._selectedIndices) {
    selectedItems[key] = this._items[key];
  }
  // Switch back to the play screen.
  Game.Screen.playScreen.setSubScreen(undefined);
  // Call the OK function and end the player's turn if it return true.
  if (this._okFunction(selectedItems)) {
    this._player
      .getMap()
      .getEngine()
      .unlock();
  }
};
Game.Screen.ItemListScreen.prototype.handleInput = function(
  inputType,
  inputData
) {
  if (inputType === "keydown") {
    // If the user hit escape, hit enter and can't select an item, or hit
    // enter without any items selected, simply cancel out
    if (
      inputData.keyCode === ROT.KEYS.VK_ESCAPE ||
      (inputData.keyCode === ROT.KEYS.VK_RETURN &&
        (!this._canSelectItem ||
          Object.keys(this._selectedIndices).length === 0))
    ) {
      Game.Screen.playScreen.setSubScreen(undefined);
      // Handle pressing return when items are selected
    } else if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
      this.executeOkFunction();
      // Handle pressing a letter if we can select
    } else if (
      this._canSelectItem &&
      inputData.keyCode >= ROT.KEYS.VK_A &&
      inputData.keyCode <= ROT.KEYS.VK_Z
    ) {
      // Check if it maps to a valid item by subtracting 'a' from the character
      // to know what letter of the alphabet we used.
      const index = inputData.keyCode - ROT.KEYS.VK_A;
      if (this._items[index]) {
        // If multiple selection is allowed, toggle the selection status, else
        // select the item and exit the screen
        if (this._canSelectMultipleItems) {
          if (this._selectedIndices[index]) {
            delete this._selectedIndices[index];
          } else {
            this._selectedIndices[index] = true;
          }
          // Redraw screen
          Game.refresh();
        } else {
          this._selectedIndices[index] = true;
          this.executeOkFunction();
        }
      }
    }
  }
};

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
  caption: "Inventory",
  canSelect: false
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
  caption: "Choose the items you wish to pickup",
  canSelect: true,
  canSelectMultipleItems: true,
  ok: function(selectedItems) {
    // Try to pick up all items, messaging the player if they couldn't all be
    // picked up.
    if (!this._player.pickupItems(Object.keys(selectedItems))) {
      Game.sendMessage(
        this._player,
        "Your inventory is full! Not all items were picked up."
      );
    }
    return true;
  }
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
  caption: "Choose the item you wish to drop",
  canSelect: true,
  canSelectMultipleItems: false,
  ok: function(selectedItems) {
    // Drop the selected item
    this._player.dropItem(Object.keys(selectedItems)[0]);
    return true;
  }
});

//TODO: Maybe a screen to drop several items or to drop all your items?
