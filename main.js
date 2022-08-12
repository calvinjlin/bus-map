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

// Step 1: get the blob id
const url = "https://data.texas.gov/api/views/cuc7-ywmd/";
let data2 = "";
$.ajax({
  method: "GET",
  url: url,
  success: function (data) {
    //data is a JSON object
    console.info(data);
    let blobsid = data.blobId;
    let newurl = url + "files/" + blobsid + "?filename=vehiclepositions.json";
    console.log("New url: " + newurl);
    // Step 2: get the data
    $.ajax({
      method: "GET",
      url: newurl,
      success: function (data) {
        console.info(data);
        dowork(JSON.parse(data));
        addmarker();
      },
    });
  },
});

function dowork(viewdata) {
  console.log("Do work");
  let bus_array = viewdata.entity;
  console.log(bus_array);
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

async function addmarker() {
  const url = "https://calvinjlin.github.io/bus-map/Routes.geojson";
  $.ajax({
    method: "GET",
    url: url,
    success: function (data) {
      console.info(data);
      L.geoJSON(data).addTo(map);
    },
  });
}
