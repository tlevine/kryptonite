window.onload = function() {
  Parse.initialize("1znInkUwxEU1tSd7Ee7SX9WL9c3whQXh4esOLREB", "eNGcDrnLPePX7kQcjd3L5HsHWdQXX9HzHskP18nG");
  $('#broadcast').submit(function(e) {
    e.preventDefault()
    var formdata = Parse._.reduce($('#broadcast').serializeArray(), function(input, output) {
      input[output.name] = output.value
      return input
    }, {})
    var incident = new Parse.Object('Incident')
    incident.save(formdata)
    return false
  })
}
