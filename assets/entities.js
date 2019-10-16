// Create our Mixins namespace
Game.Mixins = {};

/**** MIXINS ****/

// Define our Moveable mixin
Game.Mixins.Moveable = {
  name: "Moveable",
  tryMove: function(x, y, map) {
    const tile = map.getTile(x, y);
    const target = map.getEntityAt(x, y);
    // If an entity was present at the tile
    if (target) {
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
      this._x = x;
      this._y = y;
      return true;
      // Check if the tile is diggable, and
      // if so try to dig it
    } else if (tile.isDiggable()) {
      map.dig(x, y);
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
      if (
        (xOffset != 0 || yOffset != 0) &&
        this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset)
      ) {
        // Check if we can actually spawn at that location, and if so
        // then we grow!
        const entity = new Game.Entity(Game.FungusTemplate);
        entity.setX(this.getX() + xOffset);
        entity.setY(this.getY() + yOffset);
        this.getMap().addEntity(entity);
        this._growthsRemaining--;
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
    // If have 0 or less HP, then remove ourseles from the map
    if (this._hp <= 0) {
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
      //TODO: Refactor this to use Basic Fantasy Attack bonus + d20 >= AC
      const attack = this.getAttackValue();
      const defense = target.getDefenseValue();
      const max = Math.max(0, attack - defense);
      target.takeDamage(this, 1 + Math.floor(Math.random() * max));
    }
  },
  getAttackValue: function() {
    return this._attackValue;
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
    Game.Mixins.Destructible
  ]
};

// Fungus template
Game.FungusTemplate = {
  character: "F",
  foreground: "green",
  maxHp: 10,
  mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
};
