(function(){
  Parse.initialize("1znInkUwxEU1tSd7Ee7SX9WL9c3whQXh4esOLREB", "eNGcDrnLPePX7kQcjd3L5HsHWdQXX9HzHskP18nG");
  var Incident = Parse.Object.extend('Incident')
  var Location = Parse.Object.extend('Location')

  // Make the map
  var initializeMap = function() {
    var mapOptions = {
      zoom: 20,
      center: new google.maps.LatLng(37.750254,-122.406951),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    var incident_marker = null
    
    google.maps.event.addListener(map, 'click', function( mouse_event /* google.maps.MouseEvent */ ) {
      if ( incident_marker ) {
        incident_marker.setMap(null)
      }
       incident_marker = new google.maps.Marker({
        position: mouse_event.latLng,
        map: map,
      });
      
      $("#lat").text(mouse_event.latLng.lat())
      $("#long").text(mouse_event.latLng.lng())
      
    });
  }

  // On clicking the "submit" button
  var broadcast = function(e) {
    e.preventDefault()
    var data = Parse._.reduce($('#broadcast').serializeArray(), function(input, output) {
      input[output.name] = output.value
      return input
    }, {})
  
    // Make the date a date.
    data.date = new Date(data.date)
    data.date.setHours(data.date.getHours() + (1 * data.hour))
    delete data.hour
  
    // Look up nearby readings in location
    var incidentLocation = new Parse.GeoPoint(37.822802, -122.373962)
    var query = new Parse.Query(Location)
  
    // and in time
    var startDate = new Date()
    var endDate = new Date()
    startDate.setTime(data.date.getTime())
    endDate.setTime(data.date.getTime())
    startDate.setHours(startDate.getHours() - 6)
    endDate.setHours(endDate.getHours() + 6)
  
    // Run the query.
    query
      .near('location', incidentLocation)
      .lessThanOrEqualTo('date', endDate)
      .greaterThanOrEqualTo('date', startDate)
      .select('udid')
      .find().then(function(locations){
        console.log(locations)
       })
  
    // Save it to parse
    var incident = new Incident
    incident.save(data)
  
    // For debugging
    window.data = data
  
    return false
  }


  // Main function
  google.maps.event.addDomListener(window, 'load', initializeMap)
  window.onload = function() { 
    // Set defaults.
    var d = new Date()
    $('input[type=date]').attr('value', (d.getFullYear() + '-0' + (d.getMonth() + 1) + '-0' + d.getDate()).replace('00','0'))

    // Handle the click.
    $('#broadcast').submit(broadcast)
  }
})()
