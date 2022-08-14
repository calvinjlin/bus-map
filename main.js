// initialize the map
let map = L.map("map").setView([30.28, -97.74], 11);

// load a tile layer
L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Icon options
let iconOptions = {
  iconUrl: "bus.svg",
  iconSize: [15, 30],
};
// Creating a custom icon
let customIcon = L.icon(iconOptions);

// Creating Marker Options
let markerOptions = {
  // title: "MyLocation",
  // clickable: true,
  // draggable: true,
  icon: customIcon,
};
map.zoomControl.setPosition("bottomright");
let busMarkerLayer = L.layerGroup().addTo(map);
let sidebar = L.control.sidebar("sidebar").addTo(map);

drawRoutes();
getBusData();

document.getElementById("bus-refresh-button").innerHTML += "<p>Success</p>";

let interval = setInterval(getBusData, 15000);
// console.log("Initi"+interval)
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    console.log("Tab hidden");
    console.log(interval);
    clearInterval(interval);
  } else {
    console.log("Tab visible");
    clearInterval(interval);
    interval = setInterval(getBusData, 15000);
    console.log(interval);
  }
}
document.addEventListener("visibilitychange", handleVisibilityChange, false);
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
