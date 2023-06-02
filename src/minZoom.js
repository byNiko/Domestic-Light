// Get the largest screen dimension 
// reason for doing this is a phone may start in portrait then move to landscape
var maxScreenDimension = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;

// assuming tiles are 256 x 256
var tileSize = 256;

// How many tiles needed to for the largest screen dimension
// I take the floor because I don't want to see more then 1 world
// Use Math.ceil if you don't mind seeing the world repeat
var maxTiles = Math.floor(maxScreenDimension / tileSize);

/* MATH MAGIC !!!!!
    number of tiles needed for one side = 2 ^ zoomlevel
    or
    maxTiles = 2 ^ zoomlevel
    Time to show my steps! assuming log base 2 for all steps
    
    log(2 ^ zoomlevel) = log(maxTiles)
    properties of logs
    zoomlevel * log(2) = log(maxTiles)
    log base 2 of 2 is just 1
    zoomlevel * 1 = log(maxTiles)
    JS Math.log is ln (natural log) not base 2
    So we need to use another log property
    Math.log(maxTiles) / Math.log(2) = Log base 2 of maxTiles
*/

// I am taking the ceiling so I don't see more then 1 world
// Use Math.floor if you don't mind seeing the world repeat
 let minZoom = Math.floor(Math.log(maxTiles) / Math.log(2));
// minZoom = 2;
// only let minZoom be 2 or higher
minZoom = minZoom < 2 ? 2 : minZoom;

export default minZoom



