Game.Item = function(properties) {
  properties = properties || {};
  // Call the glyph's construtor with our set of properties
  Game.Glyph.call(this, properties);
  // Instantiate any properties from the passed object
  this._name = properties["name"] || "";
};
// Make items inherit all the functionality from glyphs
Game.Item.extend(Game.Glyph);

Game.Item.prototype.describe = function() {
  return this._name;
};
Game.Item.prototype.describeA = function(capitalize) {
  // Optional parameter to capitalize the a/an.
  const prefixes = capitalize ? ["A", "An"] : ["a", "an"];
  const name = this.describe();
  const firstLetter = name.charAt(0).toLowerCase();
  // If word starts by a vowel, use an, else use a. Note that this is not perfect.
  const prefix = "aeiou".indexOf(firstLetter) >= 0 ? 1 : 0;

  return `${prefixes[prefix]} ${name}`;
};
