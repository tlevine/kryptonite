window.onload = function() {
  Parse.initialize("1znInkUwxEU1tSd7Ee7SX9WL9c3whQXh4esOLREB", "eNGcDrnLPePX7kQcjd3L5HsHWdQXX9HzHskP18nG");
  document.getElementById('broadcast').addEventListener('submit', function(e) {
    e.preventDefault()
    alert(3)
    return false
  }, false)
}
