Game.extend = function(src, dest) {
  // //TODO: volver a mirar!
  // Create a copy of the source.
  var result = {};
  for (var key in src) {
    result[key] = src[key];
  }
  // Copy over all keys from dest
  for (var index in dest) {
    result[index] = dest[index];
  }
  return result;
  // const copyDest = Object.assign({}, dest);
  // return Object.assign(copyDest, src);
};
