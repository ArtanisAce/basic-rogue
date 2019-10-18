Game.Map = function(tiles, player) {
  this._tiles = tiles;
  // cache dimensions
  this._depth = tiles.length;
  this._width = tiles[0].length;
  this._height = tiles[0][0].length;
  // create a list which will hold the entities
  this._entities = [];
  // create the engine and scheduler
  this._scheduler = new ROT.Scheduler.Simple();
  this._engine = new ROT.Engine(this._scheduler);
  // add the player
  this.addEntityAtRandomPosition(player, 0);
  // add random fungi
  for (var z = 0; z < this._depth; z++) {
    for (var i = 0; i < 25; i++) {
      this.addEntityAtRandomPosition(new Game.Entity(Game.FungusTemplate), z);
    }
  }
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
  // Iterate through all entities searching for one with
  // matching position
  for (let i = 0; i < this._entities.length; i++) {
    if (
      this._entities[i].getX() == x &&
      this._entities[i].getY() == y &&
      this._entities[i].getZ() == z
    ) {
      return this._entities[i];
    }
  }
  return false;
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
  for (let i = 0; i < this._entities.length; i++) {
    if (
      this._entities[i].getX() >= leftX &&
      this._entities[i].getX() <= rightX &&
      this._entities[i].getY() >= topY &&
      this._entities[i].getY() <= bottomY &&
      this._entities[i].getZ() == centerZ
    ) {
      results.push(this._entities[i]);
    }
  }
  return results;
};

Game.Map.prototype.addEntity = function(entity) {
  // Make sure the entity's position is within bounds
  if (
    entity.getX() < 0 ||
    entity.getX() >= this._width ||
    entity.getY() < 0 ||
    entity.getY() >= this._height ||
    entity.getZ() < 0 ||
    entity.getZ() >= this._depth
  ) {
    throw new Error("Adding entity out of bounds.");
  }
  // Update the entity's map
  entity.setMap(this);
  // Add the entity to the list of entities
  this._entities.push(entity);
  // Check if this entity is an actor, and if so add
  // them to the scheduler
  if (entity.hasMixin("Actor")) {
    this._scheduler.add(entity, true);
  }
};

Game.Map.prototype.removeEntity = function(entity) {
  // Find the entity in the list of entities if it is present
  for (let i = 0; i < this._entities.length; i++) {
    if (this._entities[i] == entity) {
      this._entities.splice(i, 1);
      break;
    }
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
