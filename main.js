// initialize the map
let map = L.map("map").setView([30.28, -97.74], 11);

// load a tile layer
L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

map.zoomControl.setPosition("bottomright");
let busMarkerLayer = L.layerGroup().addTo(map);
let sidebar = L.control.sidebar("sidebar").addTo(map);

const busStopMarker = L.divIcon({
  html: `
  <svg
    width="100"
    height="100"
    viewbox="0 0 100 100"
    version="1.1"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="25" cy="75" r=dd"20"/>
  </svg>
  `,
  className: "",
  iconSize: [50, 50],
});

const circleMarkerOptions = {
  radius: 5,
  fillColor: "#3388ff",
  color: "#000",
  weight: 0,
  opacity: 0,
  fillOpacity: 1,
};

// Create bus icon
let iconOptions = {
  iconUrl: "bus.svg",
  iconSize: [15, 30],
};
let customIcon = L.icon(iconOptions);
let markerOptions = {
  // title: "MyLocation",
  // clickable: true,
  // draggable: true,
  icon: customIcon,
};

drawRoutes();
drawStops();
getBusData();

document.getElementById("bus-refresh-button").innerHTML += "<p>Success</p>";

let interval = setInterval(getBusData, 15000);
document.addEventListener("visibilitychange", handleVisibilityChange, false);

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    console.log("Tab hidden");
    console.log(interval);
    clearInterval(interval);
  } else {
    console.log("Tab visible");
    getBusData();
    clearInterval(interval);
    interval = setInterval(getBusData, 15000);
    console.log(interval);
  }
}

async function getBusData() {
  console.log("Run");
  const BUS_POSITION_URL = "https://data.texas.gov/api/views/cuc7-ywmd/";
  fetch(BUS_POSITION_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      let newUrl =
        BUS_POSITION_URL +
        "files/" +
        data.blobId +
        "?filename=vehiclepositions.json";
      fetch(newUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          drawBuses(data);
        });
    })
    .catch((e) => {
      console.warn(e.message);
    });
}

async function drawBuses(viewdata) {
  let bus_array = viewdata.entity;
  busMarkerLayer.clearLayers();
  bus_array.forEach((element) => {
    let bus_number = element.id;
    let position = element.vehicle.position;
    let lat = position.latitude;
    let lon = position.longitude;
    let speed = position.speed;
    let direction = position.bearing;
    let marker = L.marker([lat, lon], markerOptions, {
      rotationAngle: direction,
    });
    marker.setRotationAngle(direction);
    marker.setRotationOrigin("center center");
    let message = `
        <b>Bus #${bus_number} </b> <br>
        Speed ${speed} <br>
        Direction ${direction} <br>
      `;
    marker.bindPopup(message).openPopup();
    marker.addTo(busMarkerLayer);
  });
}

async function refreshBuses() {
  getBusData();
}

async function drawRoutes() {
  fetch("Routes.geojson")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      L.geoJSON(data).addTo(map);
    })
    .catch((e) => {
      console.warn(e.message);
    });
}

async function drawStops() {
  fetch("Stops.geojson")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, circleMarkerOptions);
        },
      }).addTo(map);
      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          return L.circle(latlng, { radius: 402,opacity:0.5,fillOpacity:0 }).addTo(map);
        },
      }).addTo(map);
    })
    .catch((e) => {
      console.warn(e.message);
    });
}
