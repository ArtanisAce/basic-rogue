// Player template
Game.PlayerTemplate = {
  character: "@",
  foreground: "white",
  maxHp: 20,
  attackValue: 10,
  sightRadius: 6,
  inventorySlots: 22,
  mixins: [
    Game.EntityMixins.PlayerActor,
    Game.EntityMixins.Attacker,
    Game.EntityMixins.Destructible,
    Game.EntityMixins.InventoryHolder,
    Game.EntityMixins.Sight,
    Game.EntityMixins.MessageRecipient,
    Game.EntityMixins.FoodConsumer,
    Game.EntityMixins.Equipper
  ]
};

// Create our central entity repository
Game.EntityRepository = new Game.Repository("entities", Game.Entity);

Game.EntityRepository.define("fungus", {
  name: "fungus",
  character: "F",
  foreground: "green",
  maxHp: 10,
  speed: 250,
  mixins: [Game.EntityMixins.FungusActor, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define("bat", {
  name: "bat",
  character: "B",
  foreground: "white",
  maxHp: 5,
  attackValue: 4,
  speed: 2000,
  mixins: [
    Game.EntityMixins.TaskActor,
    Game.EntityMixins.Attacker,
    Game.EntityMixins.Destructible,
    Game.EntityMixins.CorpseDropper
  ]
});

Game.EntityRepository.define("newt", {
  name: "newt",
  character: ":",
  foreground: "yellow",
  maxHp: 3,
  attackValue: 2,
  mixins: [
    Game.EntityMixins.TaskActor,
    Game.EntityMixins.Attacker,
    Game.EntityMixins.Destructible,
    Game.EntityMixins.CorpseDropper
  ]
});

Game.EntityRepository.define("kobold", {
  name: "kobold",
  character: "k",
  foreground: "white",
  maxHp: 6,
  attackValue: 4,
  sightRadius: 5,
  tasks: ["hunt", "wander"],
  mixins: [
    Game.EntityMixins.TaskActor,
    Game.EntityMixins.Sight,
    Game.EntityMixins.Attacker,
    Game.EntityMixins.Destructible,
    Game.EntityMixins.CorpseDropper
  ]
});
