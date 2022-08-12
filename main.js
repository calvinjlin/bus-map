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

drawRoutes();
var sidebar = L.control.sidebar('sidebar').addTo(map);

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



async function drawBuses(viewdata) {
  let bus_array = viewdata.entity;
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
    // var marker = L.marker([lat, lon]);
    marker.setRotationAngle(direction);
    marker.setRotationOrigin("center center");
    let message = `
        <b>Bus #${bus_number} </b> <br>
        Speed ${speed} <br>
        Direction ${direction} <br>
      `;
    marker.bindPopup(message).openPopup();
    marker.addTo(map);
  });
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
