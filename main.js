// Define an array of GeoJSON file URLs in the desired order
const jsonUrls = [ 
];

// Define an array of GeoJSON file URLs in the desired order
const geoJsonUrls = [
  './static/stations-ostsee.geojson'
];

let currentClickedLayer = null;
let currentClickedMarker = null;
let metaDataArray = null;

const circleMarkers = [];
const geoJsonLayers = [];

const style1 = {
  fillColor: '#fff',
  fillOpacity: .6,
  color: '#989898',
  weight: 2,
};

// Define different pointToLayer functions with an index parameter
const pointToLayerFunctions = [
  (feature, latlng, index) => {
    // Add a tooltip to the CircleMarker
    const label = feature.properties.shortname;

    const defaultIcon = L.icon({
      iconUrl: './static/marker-icon-blue.png',
      shadowUrl: './static/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      tooltipAnchor: [2, -41],
      shadowSize: [45, 41] 
    })

    return L.marker(latlng, {icon: defaultIcon}).bindTooltip(label, {
      permanent: false,
      direction: 'top'
    }).openTooltip()
  },
];

// Define different onEachFeature functions with an index parameter
const onEachFeatureFunctions = [
  (feature, layer, index) => {
    // Add a click event handler for each layer
    layer.on('click', function (e) {
      map.setView(e.latlng, 12);

      const stationId = e.target.feature.properties.uuid;
      const stationDetails = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${stationId}/W/currentmeasurement.json`;

      fetchStationDetail(stationDetails).then((data) => {
        const date = new Date(data.timestamp)
        const time = date.toLocaleString('de', { timeZone: 'Europe/Berlin' });

        const stationValue = document.querySelector('#stationValue')
        const stationValueTime = document.querySelector('#stationValueTime')

        const waterlevel = data.value / 100 - 5
        const waterlevelRounded = waterlevel.toFixed(2)

        stationValue.innerText = `${waterlevelRounded} m über Pegelnullpunkt`
        stationValueTime.innerText = `${time} Uhr`
      })

      let detailOutput = '';

      detailOutput += `<li><strong>Stationsname</strong> ${e.target.feature.properties.longname}</li>`;
      detailOutput += `<li><strong>Stationsnummer</strong> ${e.target.feature.properties.number}</li>`;
      detailOutput += `<li><strong>Messwert</strong> <span id="stationValue">lädt</span></li>`;
      detailOutput += `<li><strong>Messzeit</strong> <span id="stationValueTime">lädt</span></li>`;

      const element = document.querySelector('#details');
      element.innerHTML = `<ul class="p-3 space-y-2 bg-gray-700 text-white mb-4 md:mb-8"> ${detailOutput}</ul>`;
    });
  },
];

const styles = [style1];

// Initialize map
const map = L.map('map', {
  maxZoom: 19
}).setView([53.89314, 11.45286], 8)

/* L.tileLayer.wms('https://sgx.geodatenzentrum.de/wms_basemapde?SERVICE=WMS&Request=GetCapabilities', {
  layers: 'de_basemapde_web_raster_grau',
  maxZoom: 19, 
  attribution: '<a href="https://www.bkg.bund.de">GeoBasis-DE BKG</a> | <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>'
}).addTo(map); */

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Create an array of jsonPromises for fetching JSON data
const jsonPromises = jsonUrls.map((url, index) =>
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
);

// Create an array of geoJsonPromises for fetching GeoJSON data
const geoJsonPromises = geoJsonUrls.map((url, index) =>
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let geojsonLayer

      // For other layers, use the default onEachFeature function
      geojsonLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          // Call the corresponding pointToLayer function with the index parameter
          return pointToLayerFunctions[index](feature, latlng, index);
        },
        onEachFeature: (feature, layer) => {
          // Call the corresponding onEachFeature function with the index parameter
          onEachFeatureFunctions[index](feature, layer, index);
        },
      });

      // Store the GeoJSON layer in the geoJsonLayers array
      geoJsonLayers.push(geojsonLayer);

      return geojsonLayer;
    })
);

// Use Promise.all to wait for all geoJsonPromises to resolve
Promise.all(jsonPromises)
 .then((data) => {
    metaDataArray = data;
  })
  .catch((error) => {
    console.error('Error fetching GeoJSON data:', error);
  });

// Use Promise.all to wait for all geoJsonPromises to resolve
Promise.all(geoJsonPromises)
 .then((layers) => {
    layers[0].addTo(map)

    // Calculate the bounds based on all GeoJSON layers
    const bounds = L.featureGroup(layers).getBounds();

    const center = bounds.getCenter();
    const newLatitude = center.lat + 0.01;
    const newCenter = L.latLng(newLatitude, center.lng);
    // map.setView(newCenter, 13);

    // Event listener to update circle marker radius when zoom changes
    map.on('zoomend', function () {
      const zoom = map.getZoom();

      layers[0].eachLayer(function (layer) {
        const radius = calculateRadius(zoom);
      }); 
    });

    // Create a LayerGroup and add your layers to it
    const layerGroup = L.layerGroup(...layers);
  })
  .catch((error) => {
    console.error('Error fetching GeoJSON data:', error);
  });

function fetchStationDetail(url) {
  return fetch(url, {
    method: 'GET'
  })
  .then((response) => {
    return response.json()
  })
  .then((data) => {
    return data
  })
  .catch(function (error) {
    console.error(error)
  })
}

function removeLeadingZero(inputString) {
  if (inputString !== null && inputString.startsWith('0')) {
    return parseInt(inputString.substring(1));
  }

  return parseInt(inputString);
}

function calculateRadius(zoom) {
  let value

  if (zoom >= 16) {
    value = 6
  }
  else if (zoom >= 13 && zoom < 16) {
    value = 4
  }
  else if (zoom < 13) {
    value = 2
  }

  return value
}