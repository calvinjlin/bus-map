class Stops {
  constructor(){
    fetch("Stops.geojson")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      this.data = data
      if (this.stopsEnabled()) {
        this.draw()
      }
      if (this.walkshedEnabled()) {
        this.drawWalkshed()
      }
    })
    .catch((e) => {
      console.warn(e.message);
    });

    this.stopsLayer = L.layerGroup().addTo(map);
    this.walkshedLayer = L.layerGroup().addTo(map);

    this.circleMarkerOptions = {
      radius: 5,
      fillColor: "#3388ff",
      color: "#000",
      weight: 0,
      opacity: 0,
      fillOpacity: 1,
    }

    
  }
  draw() {
    L.geoJSON(this.data, {
      pointToLayer: (feature, latlng) => {
        let marker = L.circleMarker(latlng, this.circleMarkerOptions)
        let props = feature.properties
        marker.bindPopup(`
          <b>${props.STOP_NAME} (Stop ${props.STOP_ID})</b><br>  
          Stop Type: ${props.STOP_TYPE}<br>
          Zip Code: ${props.ZIP}<br><br>
          Benches: ${props.BENCHES}<br>
          Shelters: ${props.SHELTERS}<br>
          Bike Racks: ${props.BIKERACKS}<br>
          Trash Cans: ${props.TRASHCANS}<br>
        `)
        return marker;
      },
    }).addTo(this.stopsLayer);
  }
  drawAll() {
    this.draw()
    this.drawWalkshed()
  }
  clear() {
    this.stopsLayer.clearLayers();
  }
  clearAll() {
    this.clear()
    this.clearWalkshed()
  }
  drawWalkshed() {
    L.geoJSON(this.data, {
      pointToLayer: (feature, latlng) => {
        return L.circle(latlng, {
          radius: 402,
          opacity: 0.5,
          fillOpacity: 0,
        });
      },
    }).addTo(this.walkshedLayer);
  }
  clearWalkshed() {
    this.walkshedLayer.clearLayers();
  }
  stopsEnabled() {
    var checkBox = document.getElementById("stopsVisible");
    return checkBox.checked;
  }
  walkshedEnabled() {
    var checkBox = document.getElementById("walkshedVisible");
    return checkBox.checked
  }
  toggleVisible() {
    if (this.stopsEnabled()) {
      this.draw();
    } else {
      this.clear();
    }
  }
  toggleWalkshedVisible() {
    if (this.walkshedEnabled()) {
      this.drawWalkshed();
    } else {
      this.clearWalkshed();
    }
  }
}

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

const busIcon = createBusMarker();

drawRoutes();
const stops = new Stops();
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

function createBusMarker() {
  let busStopMarker = L.divIcon({
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

  let iconOptions = {
    iconUrl: "bus.svg",
    iconSize: [15, 30],
  };

  return L.icon(iconOptions);
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

    let markerOptions = {
      // title: "MyLocation",
      // clickable: true,
      // draggable: true,
      icon: busIcon,
    };
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


