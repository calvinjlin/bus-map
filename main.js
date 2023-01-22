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
      this.walkshedLayer = L.layerGroup()
      this.stopsLayer = L.featureGroup().addTo(map);
      map.on("overlayadd", (event) => {
        // Use arrow function so that this still refers to the Stops object
        this.stopsLayer.bringToFront();
      });
      this.draw()
      this.drawWalkshed()
      layerControl.addOverlay(this.stopsLayer, "Stops");
      layerControl.addOverlay(this.walkshedLayer, "Walkshed");
    })
    .catch((e) => {
      console.warn(e.message);
    });

    
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
        marker.bindTooltip(`
          <b>${props.STOP_NAME}</b><br>
          Stop #: ${props.STOP_ID}<br>
        `)
        marker.bindPopup(`
          <b>${props.STOP_NAME}</b><br>
          Stop #: ${props.STOP_ID}<br>  
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
}

// initialize the map
let map = L.map("map").setView([30.35, -97.74], 11);

// load a tile layer
let streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
})

let carto_default = L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
 });

let carto = L.tileLayer('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
 });

 let carto_dark = L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
 });

map.zoomControl.setPosition("bottomright");
let busMarkerLayer = L.layerGroup();
let buildingsLayer = L.layerGroup();
let sidebar = L.control.sidebar("sidebar").addTo(map);
let layerControl = L.control.layers({
  'OSM': streets.addTo(map),
  'Carto': carto_default,
  'Carto Positron': carto,
  'Carto Dark Matter': carto_dark
}, {
  'Buses': busMarkerLayer.addTo(map),
  'Buildings': buildingsLayer
}).addTo(map);


var osmb = new OSMBuildings(buildingsLayer).load('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');

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
    let stopSequence = element.vehicle.currentStopSequence;
    let currentStatus = element.vehicle.currentStatus;
    let stopId = element.vehicle.stopId;
    let routeId = 'undefined'
    try {
      routeId = element.vehicle.trip.routeId;
    } catch {}
    

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
    marker.bindTooltip(`
      <b>Vehicle #${bus_number} </b><br> 
      Route ${routeId}
    `)
    let message = `
        <b>Vehicle #${bus_number} </b><br>
        Route: ${routeId}<br>
        Stop Id: ${stopId}<br>
        Stop Sequence: ${stopSequence}<br>  
        Status: ${currentStatus} <br>
        Speed: ${speed} <br>
        Direction: ${direction} <br>
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
      L.geoJSON(data, {
        onEachFeature: (feature,layer) => {
          let props = feature.properties
          layer.bindPopup(`
            <b>Route ${props.ROUTE_ID}</b><br>
            Route Name: ${props.ROUTENAME}<br>
            Route Type: ${props.ROUTETYPE}<br>
            Service Name: ${props.SERVICENM}<br>
            Service Type: ${props.SERVICETYP}<br>
          `)
          // layer.setStyle({
          //   color: '#'+props.ROUTECOLOR,
          // });

          layer.bindTooltip(`
            <b>Route ${props.ROUTE_ID}</b>
          `,{sticky: true})
          layer.on('contextmenu',()=>{
            layer.closeTooltip();  // Prevents tooltip from staying when right-clicking
            layer.bringToBack();
          })
        }
      }).addTo(map);
    })
    .catch((e) => {
      console.warn(e.message);
    });
}


