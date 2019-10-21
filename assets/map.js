Game.Map = function(tiles, player) {
  this._tiles = tiles;
  // cache dimensions
  this._depth = tiles.length;
  this._width = tiles[0].length;
  this._height = tiles[0][0].length;
  // Setup the explored array
  this._explored = new Array(this._depth);
  this._setupExploredArray();
  // create a list which will hold the entities
  this._entities = {};
  // create the engine and scheduler
  this._scheduler = new ROT.Scheduler.Simple();
  this._engine = new ROT.Engine(this._scheduler);
  // add the player
  this.addEntityAtRandomPosition(player, 0);
  // Add random enemies to each floor.
  const templates = [Game.FungusTemplate, Game.BatTemplate, Game.NewtTemplate];
  for (let z = 0; z < this._depth; z++) {
    for (let i = 0; i < 15; i++) {
      // Randomly select a template
      const template = templates[Math.floor(Math.random() * templates.length)];
      // Place the entity
      this.addEntityAtRandomPosition(new Game.Entity(template), z);
    }
  }
  // setup the field of visions
  this._fov = [];
  this.setupFov();
};

// Standard getters
Game.Map.prototype.getWidth = function() {
  return this._width;
};
Game.Map.prototype.getHeight = function() {
  return this._height;
};
Game.Map.prototype.getDepth = function() {
  return this._depth;
};

// Gets the tile for a given coordinate set
Game.Map.prototype.getTile = function(x, y, z) {
  // Make sure we are inside the bounds. If we aren't, return
  // null tile.
  if (
    x < 0 ||
    x >= this._width ||
    y < 0 ||
    y >= this._height ||
    z < 0 ||
    z >= this._depth
  ) {
    return Game.Tile.nullTile;
  } else {
    return this._tiles[z][x][y] || Game.Tile.nullTile;
  }
};

Game.Map.prototype.dig = function(x, y, z) {
  // If the tile is diggable, update it to a floor
  if (this.getTile(x, y, z).isDiggable()) {
    this._tiles[z][x][y] = Game.Tile.floorTile;
  }
};

Game.Map.prototype.isEmptyFloor = function(x, y, z) {
  // Check if the tile is floor and also has no entity
  return (
    this.getTile(x, y, z) == Game.Tile.floorTile && !this.getEntityAt(x, y, z)
  );
};

Game.Map.prototype.getEntityAt = function(x, y, z) {
  // Get the entity based on position key
  return this._entities[x + "," + y + "," + z];
};

Game.Map.prototype.getEntitiesWithinRadius = function(
  centerX,
  centerY,
  centerZ,
  radius
) {
  results = [];
  // Determine our bounds
  const leftX = centerX - radius;
  const rightX = centerX + radius;
  const topY = centerY - radius;
  const bottomY = centerY + radius;
  // Iterate through our entities, adding any which are within the bounds
  for (let key in this._entities) {
    const entity = this._entities[key];
    if (
      entity.getX() >= leftX &&
      entity.getX() <= rightX &&
      entity.getY() >= topY &&
      entity.getY() <= bottomY &&
      entity.getZ() == centerZ
    ) {
      results.push(entity);
    }
  }
  return results;
};

Game.Map.prototype.addEntity = function(entity) {
  // Update the entity's map
  entity.setMap(this);
  // Update the map with the entity's position
  this.updateEntityPosition(entity);
  // Check if this entity is an actor, and if so add
  // them to the scheduler
  if (entity.hasMixin("Actor")) {
    this._scheduler.add(entity, true);
  }
};

Game.Map.prototype.updateEntityPosition = function(entity, oldX, oldY, oldZ) {
  // Delete the old key if it is the same entity and we have old positions.
  if (oldX !== undefined) {
    const oldKey = oldX + "," + oldY + "," + oldZ;
    if (this._entities[oldKey] == entity) {
      delete this._entities[oldKey];
    }
  }
  // Make sure the entity's position is within bounds
  if (
    entity.getX() < 0 ||
    entity.getX() >= this._width ||
    entity.getY() < 0 ||
    entity.getY() >= this._height ||
    entity.getZ() < 0 ||
    entity.getZ() >= this._depth
  ) {
    throw new Error("Entity's position is out of bounds.");
  }
  // Sanity check to make sure there is no entity at the new position.
  const key = entity.getX() + "," + entity.getY() + "," + entity.getZ();
  if (this._entities[key]) {
    throw new Error("Tried to add an entity at an occupied position.");
  }
  // Add the entity to the table of entities
  this._entities[key] = entity;
};

Game.Map.prototype.removeEntity = function(entity) {
  // Remove the entity from the map
  const key = entity.getX() + "," + entity.getY() + "," + entity.getZ();
  if (this._entities[key] == entity) {
    delete this._entities[key];
  }
  // If the entity is an actor, remove them from the scheduler
  if (entity.hasMixin("Actor")) {
    this._scheduler.remove(entity);
  }
};

Game.Map.prototype.getRandomFloorPosition = function(z) {
  // Randomly generate a tile which is a floor
  let x, y;
  do {
    x = Math.floor(Math.random() * this._width);
    y = Math.floor(Math.random() * this._height);
  } while (!this.isEmptyFloor(x, y, z));
  return { x: x, y: y, z: z };
};

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z) {
  const position = this.getRandomFloorPosition(z);
  entity.setX(position.x);
  entity.setY(position.y);
  entity.setZ(position.z);
  this.addEntity(entity);
};

Game.Map.prototype.getEngine = function() {
  return this._engine;
};
Game.Map.prototype.getEntities = function() {
  return this._entities;
};

Game.Map.prototype.setupFov = function() {
  // Keep this in 'map' variable so that we don't lose it.
  const map = this;
  // Iterate through each depth level, setting up the field of vision
  for (let z = 0; z < this._depth; z++) {
    // We have to put the following code in it's own scope to prevent the
    // depth variable from being hoisted out of the loop.
    (function() {
      // For each depth, we need to create a callback which figures out
      // if light can pass through a given tile.
      const depth = z;
      map._fov.push(
        new ROT.FOV.DiscreteShadowcasting(
          function(x, y) {
            return !map.getTile(x, y, depth).isBlockingLight();
          },
          { topology: 4 }
        )
      );
    })();
  }
};

Game.Map.prototype.getFov = function(depth) {
  return this._fov[depth];
};

Game.Map.prototype._setupExploredArray = function() {
  for (let z = 0; z < this._depth; z++) {
    this._explored[z] = new Array(this._width);
    for (let x = 0; x < this._width; x++) {
      this._explored[z][x] = new Array(this._height);
      for (let y = 0; y < this._height; y++) {
        this._explored[z][x][y] = false;
      }
    }
  }
};

Game.Map.prototype.setExplored = function(x, y, z, state) {
  // Only update if the tile is within bounds
  if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
    this._explored[z][x][y] = state;
  }
};

Game.Map.prototype.isExplored = function(x, y, z) {
  // Only return the value if within bounds
  if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
    return this._explored[z][x][y];
  } else {
    return false;
  }
};
