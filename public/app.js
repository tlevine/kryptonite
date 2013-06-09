(function(){
  Parse.initialize("1znInkUwxEU1tSd7Ee7SX9WL9c3whQXh4esOLREB", "eNGcDrnLPePX7kQcjd3L5HsHWdQXX9HzHskP18nG");
  var Incident = Parse.Object.extend('Incident')
  var Location = Parse.Object.extend('Location')

  // Make the map
  var map, data
  var initializeMap = function() {
    var mapOptions = {
      zoom: 20,
      center: new google.maps.LatLng(37.783672,-122.395817),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
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
      
      $("input[name=latitude]").val(mouse_event.latLng.lat())
      $("input[name=longitude]").val(mouse_event.latLng.lng())
      search()
    });
  }
  var hits = new Array()
  var last_query = null

  // Search
  var search = function() {
    // Get form data.
    var data = Parse._.reduce($('#search').serializeArray(), function(input, output) {
      input[output.name] = output.value
      return input
    }, {})

    // Validate
    for (field in {"description":null,"phoneNumber":null,"incidentNumber":null}) {
      if (!data[field]) {
        alert('You need to provide a ' + field + '.')
      }
    }
    if (!data.longitude) {
      alert('Click on the map to select a location.')
    }
    if (data.hour === '') {
      alert('What hour of the day?')
    }
  
    // Make the date a date.
    data.date = new Date(data.date)
    data.date.setHours(data.date.getHours() + (1 * data.hour))
    delete data.hour

    // Make the location a GeoPoint
    data.location = new Parse.GeoPoint(1*data.latitude,1*data.longitude)
    delete data.longitude
    delete data.latitude
    window.data = data
  
    // Look up nearby readings in location
    last_query = new Parse.Query(Location)
  
    // and in time
    var startDate = new Date()
    var endDate = new Date()
    startDate.setTime(data.date.getTime())
    endDate.setTime(data.date.getTime())
    startDate.setHours(startDate.getHours() - 6)
    endDate.setHours(endDate.getHours() + 6)
    if (hits) {
      hits.forEach ( function ( hit ) { hit.setMap ( null )})
    }
    // Run the query.
    last_query
      .withinMiles('location', data.location, 1 * data.radius)
      .lessThanOrEqualTo('createdAt', endDate)
      .greaterThanOrEqualTo('createdAt', startDate)
      .select('udid', 'location')
      .find().then(function(locations){
        window.locations = locations
		hits = locations.map(function(location){
		  var latLng = new google.maps.LatLng ( location.get('location').latitude , location.get('location').longitude )
          var hit = new google.maps.Marker({
		        position: latLng,
		        map: map,
		        icon : "http://maps.google.com/mapfiles/kml/shapes/schools_maps.png", 
		        title: 'Possible witness'
		      });
		})
		
       })
  
    // Remove stuff
    delete data.radius
  
    // For debugging
    window.data = data

    // Enable the send button
    $('input[type=submit]').removeAttr('disabled')
  }

  var send = function (e) {
    e.preventDefault()

    // Save it to parse
    var incident = new Incident
    incident.save(window.data)

	var alert_message = window.data.description
	console.log("Sending " + alert_message);
	Parse.Push.send( {
		where: last_query,
		data : {
			alert : alert_message
		}
	});
	return false;
	}

  // Main function
  google.maps.event.addDomListener(window, 'load', initializeMap)
  window.onload = function() { 
    // Set defaults.
    var d = new Date()
    $('input[name=date]').attr('value', (d.getFullYear() + '-0' + (d.getMonth() + 1) + '-0' + d.getDate()).replace('00','0'))
    $('select[name=hour]').val(d.getHours())

    // Handle the click.
	$('#search').submit(send)
  }

  $('label[for=radius] .radius').text($('input[name=radius]').val())
  $('input[name=radius]').change(function() { $('label[for=radius] .radius').text($(this).val())})
})()
