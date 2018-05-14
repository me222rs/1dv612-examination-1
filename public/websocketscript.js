var socket = io();
socket.on('message', function(message) {
    addNotification(message);
});

//Adds an issue to the notification list
function addNotification(message) {
    console.log("4");
    var text = document.createTextNode(message);
    var divTag = document.createElement('div');
    var messages = document.getElementById('messages');
    divTag.setAttribute('class', 'notificationBox');
    divTag.appendChild(text);
    messages.appendChild(divTag);
}
