export const Kitten = window.L.TileLayer.extend({
  getTileUrl: function (coords) {
    var i = Math.ceil(Math.random() * 4);
    return "https://placekitten.com/256/256?image=" + i;
  },
  getAttribution: function () {
    return "<a href='https://placekitten.com/attribution.html'>PlaceKitten</a>";
  },
});

export function kitten(name, options) {
  return new Kitten(name, options);
}
