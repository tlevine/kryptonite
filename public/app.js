(function(){
  Parse.initialize("1znInkUwxEU1tSd7Ee7SX9WL9c3whQXh4esOLREB", "eNGcDrnLPePX7kQcjd3L5HsHWdQXX9HzHskP18nG");
  var Incident = Parse.Object.extend('Incident')
  var Location = Parse.Object.extend('Location')
  var incident_marker = null

  // Make the map
  var map

  var initializeMap = function() {
    var mapOptions = {
      zoom: 14,
      center: new google.maps.LatLng(37.783672,-122.395817),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
   
    google.maps.event.addListener(map, 'click', function( mouse_event /* google.maps.MouseEvent */ ) {
      if ( incident_marker ) {
        incident_marker.setMap(null)
      }
      incident_marker = new google.maps.Marker({
        position: mouse_event.latLng,
        map: map
      });
      var circle = new google.maps.Circle({
        map: map,
        radius: 0.000621371 * $('input[name=radius]').val(),
        fillColor: '#000000'
      });
      circle.bindTo('center', incident_marker, 'position')
      
      $("input[name=latitude]").val(mouse_event.latLng.lat())
      $("input[name=longitude]").val(mouse_event.latLng.lng())
      search()
    });
  }

  var hits = new Array()
  var last_query = null

 var sort_and_filter = function ( locations ) {
	window.locations = locations
	if ( ! incident_marker ) {
		return
	}

	var current_marker_point_parse = new Parse.GeoPoint(incident_marker.getPosition().lat(), incident_marker.getPosition().lng());


	var unique_locations = new Object();
	locations.forEach ( function(location) {
		    var installation_id = location.get('installation_id')
			var new_point_distance = current_marker_point_parse.milesTo(location.get('location'))
			var nearest_point = unique_locations[installation_id]
			var take_new_point = true
			if ( nearest_point && nearest_point.distance_from_current_marker <= new_point_distance ) {
				take_new_point = false
			}

			if ( take_new_point ) {
				location.distance_from_current_marker = new_point_distance
				unique_locations[installation_id] = location
			}
		} )
	for ( var i in unique_locations ) {
		var location = unique_locations[i]
		var GooglePoint = new google.maps.LatLng ( location.get('location').latitude , location.get('location').longitude )
		var hit = new google.maps.Marker({
					        position: GooglePoint,
					        map: map,
					        icon : "http://maps.google.com/mapfiles/kml/shapes/schools_maps.png", 
					        title: 'Possible witness'
					      });
		hit.installation_id = location.get('installation_id')
         hits.push(hit)
	}
  }

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
    console.log(data.date)
    data.date = new Date(data.date)
    data.date.setHours(24) // Use local time, assuming it is earlier than GMT
    console.log(data.date)
    data.date.setHours(data.date.getHours() + (1 * data.hour))
    console.log(data.date)
    delete data.hour

    // Make the location a GeoPoint
    data.location = new Parse.GeoPoint(1*data.latitude,1*data.longitude)
    delete data.longitude
    delete data.latitude
  
    // Look up nearby readings in location
    last_query = new Parse.Query(Location)
  
    // and in time
    var startDate = new Date()
    var endDate = new Date()
    startDate.setTime(data.date.getTime())
    endDate.setTime(data.date.getTime())
    startDate.setHours(startDate.getHours() - 6)
    endDate.setHours(endDate.getHours() + 6)
    hits.forEach ( function ( hit ) {
      if (hit) {
        hit.setMap ( null )
      } else {
        console.log('Undefined hit')
      }
    })
	hits = new Array()
    // Run the query.
    last_query
      .withinMiles('location', data.location, 1 * data.radius)
      .lessThanOrEqualTo('createdAt', endDate)
      .greaterThanOrEqualTo('createdAt', startDate)
      .select('installation_id', 'location')
      .find().then( sort_and_filter)
  
    // Remove stuff
    delete data.radius

    // Expose
    window.data = data

    // Enable the send button
    $('input[type=submit]').removeAttr('disabled')
  }

  var send = function (e) {
    e.preventDefault()

    // Save it to parse
    var incident = new Incident
    incident.save(window.data)
	
	var send_to_installation_ids = hits.map ( function ( hit ) {
		return hit.installation_id
	})
	if ( send_to_installation_ids.length <= 0 ) {
		console.log ( "No targets for push notifications")
		return;
	}
	
	//var alert_message = window.data.description + "\nCall : " + window.data.phoneNumber + "\nID : " + window.data.incidentNumber
	console.log("Sending " + window.data.description);
	var target_devices_query = new Parse.Query(Parse.Installation);
	target_devices_query.containedIn("installationId", send_to_installation_ids )
	
	Parse.Push.send( {
		where: target_devices_query,
		data : {
			alert : window.data.description,
			sound: "default",
			reference_id: window.data.incidentNumber,
			phone_number: window.data.phoneNumber
		}
	}, 	{
		  success: function() {
		    $('#map-canvas').remove()
            $('#main').append('<strong id="foo">Incident alert has been broadcast.</strong>')
		  },
	      error: function(error) {
			  console.log ( "Push unsuccessful " + error)
  	  	  }
     }
	);
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
