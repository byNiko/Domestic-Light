// styles
import "leaflet/dist/leaflet.css";
import "./styles.css";

// libraries
import * as L from "leaflet";
import "leaflet.markercluster";

// custom
import { colorList, wavelengthToHSL } from "./convertColors";
import { tmg } from "./transverseMercatorUTMGrid";

// const setups
const map = L.map("map").setView([0, -0.0], 3);

// setup External Locations in geo JSON list
const geoToken = "01PnfYABfF7j";
const geoJSONUrl = `https://api.json-generator.com/templates/${geoToken}/data`;
const myHeaders = new Headers();
myHeaders.append(
  "Authorization",
  "Bearer cqyt1wl6pl87vdcb0yzwls5g34176a33gp6h82nh"
);
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

// internal website endpoint
const userUrl = "/wp-json/dl/v1/user";
// functions
async function fetchJson(url, requestOptions) {
  const resp = await fetch(url, requestOptions);
  const result = await resp.json();
  return result;
}

function iconCreateFunction(cluster) {
  var childCount = cluster.getChildCount();

  var c = " marker-cluster-";
  if (childCount < 10) {
    c += "small";
  } else if (childCount < 100) {
    c += "medium";
  } else {
    c += "large";
  }

  return new L.DivIcon({
    html: `<span>${childCount}</span>`,
    className: "marker-cluster" + c
  });
}

function makePopup(feature) {
  let popupContent = "";
  if (feature.properties) {
    popupContent += `
    <div id="${feature.properties.uuid}" class="popup-container">
    <h1>Hello ${feature.properties.hostname}</h1>
    <div class="properties-items">`;
    if (Object.keys(feature.properties.colors).length > 0)
      for (const key in feature.properties.colors) {
        popupContent += `<div>${colorList[key]} : ${feature.properties.colors[key]}</div>`;
      }
    popupContent += `<a href="/sensor-host/${feature.properties.uuid}" class="popup-link author-info">Author Info</a>`;
    popupContent += ` </div></div>`;
  }
  return popupContent;
}

function geojsonMarkerOptions(feature) {
  return {
    id: feature.properties.uuid,
    radius: 5,
    // fillColor: `hsl(${feature.properties.marker_hsl[0]},${feature.properties.marker_hsl[1]},${feature.properties.marker_hsl[2]})`,
    fillColor: feature.properties.marker_color,
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.78
  };
}

function pointToLayer(feature, latlng) {
  var m = L.circleMarker(latlng, geojsonMarkerOptions(feature));
  m.bindPopup(makePopup(feature));
  m.id = "feature.properties.uuid";
  markers.addLayer(m);
  return markers;
}

function onEachFeature(feature, layer) {
  // console.log('f', feature)
  if (feature.properties && feature.properties.uuid) {
    if (feature.properties.uuid === clickedId) {
      layer.popupToOpen;
    }
  }
}

// load map providers
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  noWrap: true,
  bounds: [
    [-90, -180],
    [90, 180]
  ],
  attribution: "&copy; Open Street Map"
}).addTo(map);

// const USGS_USImagery = L.tileLayer(
//   "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
//   {
//     maxZoom: 8,
//     attribution:
//       'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
//   }
// );

// L.tileLayer.provider("USGS.USImagery").addTo(map);

// leaflet layer control
// const baseMaps = {
//   "Open Street Map": osm,
//   "USGS Imagery": USGS_USImagery
// };

// transverse mercator Grid
let mercatorGrid = L.geoJSON(tmg).addTo(map);
const markerClusterGroupOptions = {
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  maxClusterRadius: function (zoom) {
    return 10;
  },
  iconCreateFunction: iconCreateFunction
};
let markers = window.L.markerClusterGroup(markerClusterGroupOptions);

var clickedId;
var popupToOpen;

// this is our app
(async function init() {
  // get the data
  const sensors = await fetchJson(geoJSONUrl, requestOptions);
  markers.clearLayers();
  const geoJson = window.L.geoJSON(sensors, {
    onEachFeature: onEachFeature,
    pointToLayer: pointToLayer
  }).addTo(map);

  //console.log("here", geoJson);
  // refresh sensor data
  // setTimeout(init, 150000);
})();

map.on("popupopen", (e) => {
  console.log("open", e.target._popup._leaflet_id);
  console.log("e", e.target);
  clickedId = e.target._popup._leaflet_id;
});

// L.control.layers(baseMaps).addTo(map);
