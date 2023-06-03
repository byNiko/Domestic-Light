// styles
import "leaflet/dist/leaflet.css";
import "./styles.css";

// libraries
import * as L from "leaflet";
import "leaflet.markercluster";
import { makeChart } from "./makeChart";
import getTime from "./getTime";

// custom
import minZoom from "./minZoom";
import { colorList, wavelengthToHSL } from "./convertColors";
import { tmg } from "./transverseMercatorUTMGrid";

let activeId;
let activeChartData;

// const setups
const autoRefresh = false;
const map = L.map("map", {
  crs: L.CRS.EPSG4326,
  center: [0, 0],
  zoom: 3,
  bounds: [
    [-90, -260],
    [90, 180],
  ],
  maxBounds: [
    [-90, -260],
    [90, 180],
  ],
  minZoom: minZoom,
});

// map.setMaxBounds( map.getBounds())

// setup External Locations in geo JSON list
const geoJSONUrl = `https://api.json-generator.com/templates/${process.env.GEO_TOKEN}/data`;
console.log(geoJSONUrl);
const myHeaders = new Headers();
myHeaders.append("Authorization", `Bearer ${process.env.BEARER_TOKEN}`);
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
  let popupContent = "";
  if (feature.properties) {
    popupContent += `
    <div id="${feature.properties.uuid}" class="popup-container">
    <h1>${feature.properties.location.city}</h1>
    <h3>${feature.geometry.coordinates.join()}<h3>
    <h5>${getTime(feature)}</h5>
    <div class="chartCanvasWrapper" style="position:relative;"><canvas style="width: 100%" id="chart-${
      feature.properties.uuid
    }"></canvas></div>
   
    <div class="properties-items" style="display:none;">`;
    if (Object.keys(feature.properties.colors).length > 0)
      for (const key in feature.properties.colors) {
        popupContent += `<div>${colorList[key]} : ${feature.properties.colors[key]}</div>`;
      }
    popupContent += ` <div class="injected-content"></div>`;
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

const geoLayers = {};

function onEachFeature(feature, layer) {
  console.log("feature", layer);
  feature.dlID = feature.properties.uuid;

  // put all features into object
  geoLayers[feature.properties.uuid] = layer;

  if (feature.properties && feature.properties.uuid) {
    if (feature.properties.uuid === clickedId) {
    }
  }
}

function pointToLayer(feature, latlng) {
  // console.log("new feature", feature);
  const m = L.circleMarker(latlng, geojsonMarkerOptions(feature));
  m.dlID = feature.properties.uuid;
  m.bindPopup(makePopup(feature));
  m.on("popupopen", (e) => {
    activeChartData = feature.properties.chartColors;
    activeId = feature.properties.uuid;
  });

  markers.addLayer(m);
  return markers;
}
// load map providers
const osm = L.tileLayer(
  `https://api.maptiler.com/maps/basic-4326/{z}/{x}/{y}.png?key=${process.env.MAP_TILER_KEY}`,
  // `https://api.maptiler.com/maps/basic-4326/256/{z}/{x}/{y}@2x.png?key=BFPs9C5VBhPV4bZwUJ9E`,
  // "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  // "http://tilecache.osgeo.org/wms-c/tilecache.py/1.0.0/basic/5/32/23.png",
  // `https://api.mapbox.com/styles/v1/byniko/cli60r38c00wa01pz2ckkdtcx/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.MAPBOX_TOKEN}`,
  // `https://api.mapbox.com/styles/v1/byniko/cli4z3nkl00bq01r62l4b47tw/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.MAPBOX_TOKEN}`,
  // `http://{s}.tile.cloudmade.com/9c844409f5b845ae93ac38388077f90a/997/256/{z}/{x}/{y}.png`,
  {
    tms: false,
    maxZoom: 13,
    noWrap: true,

    attribution:
      '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <img  src="https://api.maptiler.com/resources/logo.svg">',
  }
).addTo(map);

// transverse mercator Grid
let mercatorGrid = L.geoJSON(tmg).addTo(map);
const markerClusterGroupOptions = {
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 4,
  chunkedLoading: true,
  maxClusterRadius: function (zoom) {
    return 20;
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
  // console.log("f", Object.keys(features).length);
  console.log("all markers", markers);

  console.log("layers", geoLayers);

  map.removeLayer(2);

  map.on("click", (e) => {
    console.log("geo json clicked", e);
  });
  // console.log("here", features);
  // map.openPopup(features["e83b2240-b0d3-4ea2-9cc3-c802b4cb9d02"]);
  if (popupToOpen) {
    // map.openPopup(popupToOpen);
    console.log("open?", geoJson.isPopupOpen());
  }

  map.on("layeradd", (e) => {
    console.log("added", e);
  });

  if (autoRefresh) setTimeout(init, autoRefresh);
})();

function postPopulatePopup(node, feature) {
  // const userData = await fetchJson(
  //   `${userUrl}/e83b2240-b0d3-4ea2-9cc3-c802b4cb9d02`
  // );
  // const targetDiv = node._contentNode.querySelector(".injected-content");
  // console.log('what is it', node._contentNode.children[0].id)
  // targetDiv.innerHTML = `<h3>${userData.data.display_name}</h3>`;
  setTimeout(() => {
    makeChart(activeChartData, `chart-${activeId}`);
  }, 0);
}

map.on("add", (e) => {
  console.log("added", e);
});

map.on("popupopen", async (e) => {
  // console.log("popup event", e);
  postPopulatePopup(e.popup);
  popupToOpen = e.popup;

  // return;
});

// map.on("popupclose", (e) => {
//   console.log("e", e);
//   popupToOpen = false;
// });

// const USGS_USImagery = L.tileLayer(
//   "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
//   {
//     maxZoom: 8,
//     attribution:
//       'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
//   }
// );

// leaflet layer control
// const baseMaps = {
//   "Open Street Map": osm,
//   "USGS Imagery": USGS_USImagery,
// };
