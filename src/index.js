// styles
import "leaflet/dist/leaflet.css";
import "./styles.css";

// libraries
import * as L from "leaflet";
import "leaflet.markercluster";
import { htmlOverlay } from "./HtmlOverlay";
import "./zoomCss";
// import "leaflet-customlayer";
import { makeChart } from "./makeChart";
import getTime from "./getTime";
import makeSlider from "./makeSlider";
// import { videoIframe } from "./videoIframe";
// import { Kitten } from "./L.KittenLayer";
import toDegrees from "./toDegrees";
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
  zoom: 2,
  maxBoundsViscosity: 1,
  noWrap: true,
  bounds: [
    [-90, -255],
    [90, 163],
  ],
  maxBounds: [
    [-90, -255],
    [90, 163],
  ],
  // minZoom: minZoom,
});

// map.setMaxBounds( map.getBounds())

// setup External Locations in geo JSON list
const geoJSONUrl = `https://api.json-generator.com/templates/${process.env.GEO_TOKEN}/data`;
const myHeaders = new Headers();
myHeaders.append("Authorization", `Bearer ${process.env.BEARER_TOKEN}`);
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

// internal website endpoint
const dlEndpoint = "https://dev1.3n.design/wp-json";
const userUrl = `${dlEndpoint}/dl/v1/user`;
const mediaEndpoint = `${dlEndpoint}/wp/v2/media`;

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
    <header class="popup--header">
    <div id="${feature.properties.uuid}" class="popup-container">
    <div class="popup--city">
    ${feature.properties.location.city}
    </div>
    <div class="popup--province">
    ${feature.properties.location.province} | 
    ${feature.properties.location.country}
    </div>
    <div class="popup--latLng">
    ${toDegrees(
      feature.geometry.coordinates[1], // LNG
      feature.geometry.coordinates[0] // LAT
    )}
    </div>
    <div clas="popup--time">Last reading: ${getTime(feature)}</h5>
    </header>
    <div class="popup--slide-wrapper">
    <div class="popup--slide">
    <div class="chart--canvas-wrapper">
    <canvas class="chart--canvas" id="chart-${
      feature.properties.uuid
    }"></canvas>
    </div><!-- /chart--canvas-wrapper-->
   </div>  <!-- /popup--slide -->
   <div class="popup--slide">
    <div class="injected-content"></div>
    </div> <!-- popup--slide-->
        </div> <!--/popup--slide-wraper-->
        <div class="slide--controls">
        <button class="popup--slide-btn popup--slide-btn-next">></button>
      <button class="popup--slide-btn popup--slide-btn-prev"><</button>
      </div><!-- /slide--control-->
    </div>`;
  }

  return popupContent;
}

function geojsonMarkerOptions(feature) {
  return {
    id: feature.properties.uuid,
    radius: 5,
    fillColor: `hsl(${feature.properties.marker_color.Hue}, ${feature.properties.marker_color.Saturation}, ${feature.properties.marker_color.Luminance})`,
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
    maxZoom: 3,
    noWrap: false, //true,

    attribution:
      '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <img  src="https://api.maptiler.com/resources/logo.svg">',
  }
).addTo(map);

// transverse mercator Grid
// let mercatorGrid = L.geoJSON(tmg).addTo(map);
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

async function postPopulatePopup(node, feature) {
  const userData = await fetchJson(
    `${userUrl}/e83b2240-b0d3-4ea2-9cc3-c802b4cb9d02`
  );

  const img = (async () => {
    const mediaData = await fetchJson(
      `${mediaEndpoint}/${userData.data.dl_meta.featured_image}`
    );
    const imgSrc = mediaData.media_details.sizes.full.source_url;
    const img = document.createElement("img");
    img.src = imgSrc;
    const targetDiv = node._contentNode.querySelector(".injected-content");
    // console.log("what is it", node._contentNode.children[0].id);
    targetDiv.append(img);
  })();

  setTimeout(() => {
    makeSlider(node);
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

const iframeUrl =
  "https://player.vimeo.com/video/803881950?h=dcaf80b5b0&amp;background=1&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;controls=0&amp;playsinline=1&amp;muted=1&amp;transparent=0";
const iframe = `<iframe  width="300" height="84.2" src="${iframeUrl}" frameborder="0" allow="autoplay"></iframe>`;
const imageBounds = [
  // [0, 0],
  // [0, 0],
  [-90, -257],
  [90, 163],
];

const videoOverlayOptions = {
  zoom: "-1",
};

const videoOverlay = new htmlOverlay(iframe, imageBounds, videoOverlayOptions);
videoOverlay.addTo(map);
