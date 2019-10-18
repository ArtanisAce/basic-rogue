// Create our Mixins namespace
Game.Mixins = {};

/**** MIXINS ****/

// Define our Moveable mixin
Game.Mixins.Moveable = {
  name: "Moveable",
  tryMove: function(x, y, z, map) {
    // var map = this.getMap();
    // Must use starting z
    const tile = map.getTile(x, y, this.getZ());
    const target = map.getEntityAt(x, y, this.getZ());
    // If our z level changed, check if we are on stair
    if (z < this.getZ()) {
      if (tile != Game.Tile.stairsUpTile) {
        Game.sendMessage(this, "You can't go up here!");
      } else {
        Game.sendMessage(this, "You ascend to level %d!", [z + 1]);
        this.setPosition(x, y, z);
      }
    } else if (z > this.getZ()) {
      if (tile != Game.Tile.stairsDownTile) {
        Game.sendMessage(this, "You can't go down here!");
      } else {
        this.setPosition(x, y, z);
        Game.sendMessage(this, "You descend to level %d!", [z + 1]);
      }
      // If an entity was present at the tile
    } else if (target) {
      // If we are an attacker, try to attack
      // the target
      if (this.hasMixin("Attacker")) {
        this.attack(target);
        return true;
      } else {
        // If not nothing we can do, but we can't
        // move to the tile
        return false;
      }
      // Check if we can walk on the tile
      // and if so simply walk onto it
    } else if (tile.isWalkable()) {
      // Update the entity's position
      this.setPosition(x, y, z);
      return true;
      // Check if the tile is diggable, and
      // if so try to dig it
    } else if (tile.isDiggable()) {
      map.dig(x, y, z);
      return true;
    }
    return false;
  }
};

// Main player's actor mixin
Game.Mixins.PlayerActor = {
  name: "PlayerActor",
  groupName: "Actor",
  act: function() {
    // Re-render the screen
    Game.refresh();
    // Lock the engine and wait asynchronously
    // for the player to press a key.
    this.getMap()
      .getEngine()
      .lock();
    // Clear the message queue
    this.clearMessages();
  }
};

Game.Mixins.FungusActor = {
  name: "FungusActor",
  groupName: "Actor",
  init: function() {
    this._growthsRemaining = 5;
  },
  act: function() {
    // Check if we are going to try growing this turn
    if (this._growthsRemaining > 0 && Math.random() <= 0.02) {
      // Generate the coordinates of a random adjacent square by
      // generating an offset between [-1, 0, 1] for both the x and
      // y directions. To do this, we generate a number from 0-2 and then
      // subtract 1.
      const xOffset = Math.floor(Math.random() * 3) - 1;
      const yOffset = Math.floor(Math.random() * 3) - 1;
      // Make sure we aren't trying to spawn on the same tile as us
      if (xOffset != 0 || yOffset != 0) {
        // Check if we can actually spawn at that location, and if so
        // then we grow!
        if (
          this.getMap().isEmptyFloor(
            this.getX() + xOffset,
            this.getY() + yOffset,
            this.getZ()
          )
        ) {
          const entity = new Game.Entity(Game.FungusTemplate);
          entity.setPosition(
            this.getX() + xOffset,
            this.getY() + yOffset,
            this.getZ()
          );
          this.getMap().addEntity(entity);
          this._growthsRemaining--;
          // Send a message nearby!
          Game.sendMessageNearby(
            this.getMap(),
            entity.getX(),
            entity.getY(),
            entity.getZ(),
            "The fungus is spreading!"
          );
        }
      }
    }
  }
};

Game.Mixins.Destructible = {
  name: "Destructible",
  init: function(template) {
    this._maxHp = template["maxHp"] || 10;
    // We allow taking in health from the template incase we want
    // the entity to start with a different amount of HP than the
    // max specified.
    this._hp = template["hp"] || this._maxHp;
    this._defenseValue = template["defenseValue"] || 0;
  },
  getHp: function() {
    return this._hp;
  },
  getMaxHp: function() {
    return this._maxHp;
  },
  getDefenseValue: function() {
    return this._defenseValue;
  },
  takeDamage: function(attacker, damage) {
    this._hp -= damage;
    // If have 0 or less HP, then remove it from the map
    if (this._hp <= 0) {
      Game.sendMessage(attacker, "You kill the %s!", [this.getName()]);
      Game.sendMessage(this, "You die!");
      this.getMap().removeEntity(this);
    }
  }
};

Game.Mixins.Attacker = {
  name: "Attacker",
  groupName: "Attacker",
  init: function(template) {
    this._attackValue = template["attackValue"] || 1;
  },
  attack: function(target) {
    // If the target is destructible, calculate the damage
    // based on attack and defense value
    if (target.hasMixin("Destructible")) {
      const attack = this.getAttackValue();
      const defense = target.getDefenseValue();
      const max = Math.max(0, attack - defense);
      const damage = 1 + Math.floor(Math.random() * max);
      Game.sendMessage(this, "You strike the %s for %d damage!", [
        target.getName(),
        damage
      ]);
      Game.sendMessage(target, "The %s strikes you for %d damage!", [
        this.getName(),
        damage
      ]);
      target.takeDamage(this, damage);
    }
  },
  getAttackValue: function() {
    return this._attackValue;
  }
};

Game.Mixins.MessageRecipient = {
  name: "MessageRecipient",
  init: function(template) {
    this._messages = [];
  },
  receiveMessage: function(message) {
    this._messages.push(message);
  },
  getMessages: function() {
    return this._messages;
  },
  clearMessages: function() {
    this._messages = [];
  }
};

/**** Helper functions ****/

Game.sendMessage = function(recipient, message, args) {
  // Make sure the recipient can receive the message
  // before doing any work.
  if (recipient.hasMixin(Game.Mixins.MessageRecipient)) {
    // If args were passed, then we format the message, else
    // no formatting is necessary
    if (args) {
      message = vsprintf(message, args);
    }
    recipient.receiveMessage(message);
  }
};

Game.sendMessageNearby = function(
  map,
  centerX,
  centerY,
  centerZ,
  message,
  args
) {
  // If args were passed, then we format the message, else
  // no formatting is necessary
  if (args) {
    message = vsprintf(message, args);
  }
  // Get the nearby entities
  entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
  // Iterate through nearby entities, sending the message if
  // they can receive it.
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
      entities[i].receiveMessage(message);
    }
  }
};

/****  TEMPLATES ****/

// Player template
Game.PlayerTemplate = {
  character: "@",
  foreground: "white",
  maxHp: 40,
  attackValue: 10,
  mixins: [
    Game.Mixins.Moveable,
    Game.Mixins.PlayerActor,
    Game.Mixins.Attacker,
    Game.Mixins.Destructible,
    Game.Mixins.MessageRecipient
  ]
};

// Fungus template
Game.FungusTemplate = {
  name: "fungus",
  character: "F",
  foreground: "green",
  maxHp: 10,
  mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
};
