// styles
import "leaflet/dist/leaflet.css";
import "./styles.css";

// libraries
import * as L from "leaflet";
import "leaflet.markercluster";

// custom
import * as SECRETS from "./secrets";
import { colorList, wavelengthToHSL } from "./convertColors";
import { tmg } from "./transverseMercatorUTMGrid";

// const setups
const autoRefresh = false;
const map = L.map("map").setView([0, -0.0], 3);

// setup External Locations in geo JSON list
const geoToken = SECRETS.GEO_TOKEN;
const geoJSONUrl = `https://api.json-generator.com/templates/${geoToken}/data`;
const myHeaders = new Headers();
myHeaders.append("Authorization", `Bearer ${SECRETS.BEARER_TOKEN}`);
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

// internal website endpoint
const userUrl = "https://dev1.3n.design/wp-json/dl/v1/user";
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
    className: "marker-cluster" + c,
  });
}

function makePopup(feature) {
  console.log("making popup");
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
    popupContent += ` <div class="test"></div>`;
    popupContent += `<a href="/sensor-host/${feature.properties.uuid}" class="popup-link author-info">Author Info</a>`;

    popupContent += ` </div></div>`;
  }
  return popupContent;
}

function geojsonMarkerOptions(feature) {
  return {
    id: feature.properties.uuid,
    radius: 5,
    fillColor: feature.properties.marker_color,
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.78,
  };
}

const features = {};

function pointToLayer(feature, latlng) {
  var m = L.circleMarker(latlng, geojsonMarkerOptions(feature));
  m.bindPopup(makePopup(feature));
  m.dlID = feature.properties.uuid;
  markers.addLayer(m);
  return markers;
}

function onEachFeature(feature, layer) {
  features[feature.properties.uuid] = feature;
  feature.dlID = feature.properties.uuid;
  if (feature.properties && feature.properties.uuid) {
    if (feature.properties.uuid === clickedId) {
    }
  }
}

// load map providers
// https://api.mapbox.com/styles/v1/byniko/cli4z3nkl00bq01r62l4b47tw/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYnluaWtvIiwiYSI6ImNsaHc1Yzd4ejBkeGEzZ3FhZ3gzcnJ4ZXgifQ.UEK-IhDaBU0oVIu61ZraIQ
// const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
const osm = L.tileLayer(
  // "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  // `https://api.mapbox.com/styles/v1/byniko/cli60r38c00wa01pz2ckkdtcx/tiles/256/{z}/{x}/{y}@2x?access_token=${SECRETS.MAPBOX_TOKEN},
  `https://api.mapbox.com/styles/v1/byniko/cli4z3nkl00bq01r62l4b47tw/tiles/256/{z}/{x}/{y}@2x?access_token=${SECRETS.MAPBOX_TOKEN}`,
  {
    maxZoom: 19,
    noWrap: true,
    bounds: [
      [-90, -180],
      [90, 180],
    ],
    attribution:
      '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map);

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
// let mercatorGrid = L.geoJSON(tmg).addTo(map);
const markerClusterGroupOptions = {
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  maxClusterRadius: function (zoom) {
    return 10;
  },
  iconCreateFunction: iconCreateFunction,
};
let markers = window.L.markerClusterGroup(markerClusterGroupOptions);

var clickedId;
var popupToOpen = false;
let openedPopup = false;

// this is our app
(async function init() {
  // get the sensor data
  const sensors = await fetchJson(geoJSONUrl, requestOptions);
  markers.clearLayers();
  const geoJson = window.L.geoJSON(sensors, {
    onEachFeature: onEachFeature,
    pointToLayer: pointToLayer,
  }).addTo(map);
  console.log("f", Object.keys(features).length);
  geoJson.eachLayer(function (e) {
    console.log("layers", e);
  });

  geoJson.on("click", (e) => {
    console.log("clicked", e);
    console.log("open?", geoJson.isPopupOpen());
  });
  console.log("here", features);
  // map.openPopup(features["e83b2240-b0d3-4ea2-9cc3-c802b4cb9d02"]);
  if (popupToOpen) {
    // map.openPopup(popupToOpen);
    console.log("open?", geoJson.isPopupOpen());
  }

  if (autoRefresh) setTimeout(init, autoRefresh);
})();

async function postPopulatePopup(node) {
  const userData = await fetchJson(
    `${userUrl}/e83b2240-b0d3-4ea2-9cc3-c802b4cb9d02`
  );
  node._contentNode.querySelector(
    ".test"
  ).innerHTML = `<h3>${userData.data.display_name}</h3>`;
}

map.on("popupopen", async (e) => {
  console.log("e", e);
  postPopulatePopup(e.popup);
  popupToOpen = e.popup;

  // return;
});
// map.on("popupclose", (e) => {
//   console.log("e", e);
//   popupToOpen = false;
// });

// L.control.layers(baseMaps).addTo(map);
