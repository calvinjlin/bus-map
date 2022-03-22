    // initialize the map
    var map = L.map('map').setView([30.28, -97.74], 11);
  
    // load a tile layer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    
  // Icon options
    var iconOptions = {
      iconUrl: 'bus.svg',
      iconSize: [15, 30]
    }
    // Creating a custom icon
    var customIcon = L.icon(iconOptions);
    
    // Creating Marker Options
    var markerOptions = {
      // title: "MyLocation",
      // clickable: true,
      // draggable: true,
      icon: customIcon
    }

    // Step 1: get the blob id
    var url = "https://data.texas.gov/api/views/cuc7-ywmd/"
        var data2 = ""
        $.ajax({
            method: 'GET',
            url: url,
            success: function(data){
                //data is a JSON object
                console.info(data)
                var blobsid = data.blobId
                newurl = url + "files/" + blobsid + "?filename=vehiclepositions.json"
                console.log("New url: " + newurl)
                // Step 2: get the data
                $.ajax({
                    method: 'GET',
                    url: newurl,
                    success: function(data){
                        console.info(data);
                        dowork(JSON.parse(data));
                        addmarker()
                }
        })
            }
        })   
function dowork(viewdata) 
{   
    console.log('Do work')
    bus_array = viewdata.entity
    console.log(bus_array)
    bus_array.forEach(element => {
      var bus_number = element.id
      var position = element.vehicle.position
      var lat = position.latitude
      var lon = position.longitude
      var speed = position.speed
      var direction = position.bearing
      var marker = L.marker([lat, lon],markerOptions,{rotationAngle: direction});
      // var marker = L.marker([lat, lon]);
      marker.setRotationAngle(direction)
      marker.setRotationOrigin('center center')
      var message = `
        <b>Bus #${bus_number} </b> <br>
        Speed ${speed} <br>
        Direction ${direction} <br>
      `;
      marker.bindPopup(message).openPopup();
      marker.addTo(map);
    });
}     
async function addmarker()
{
 
  url = 'https://calvinjlin.github.io/bus-map/Routes.geojson'
  $.ajax({
    method: 'GET',
    url: url,
    success: function(data){
        console.info(data);
        L.geoJSON(data).addTo(map)

    }
  })  

}