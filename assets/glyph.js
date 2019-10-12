Game.Glyph = function({
  char = " ",
  foreground = "white",
  background = "black"
} = {}) {
  this._char = char;
  this._foreground = foreground;
  this._background = background;
};

// Create standard getters for glyphs
Game.Glyph.prototype.getChar = function() {
  return this._char;
};
Game.Glyph.prototype.getBackground = function() {
  return this._background;
};
Game.Glyph.prototype.getForeground = function() {
  return this._foreground;
};
