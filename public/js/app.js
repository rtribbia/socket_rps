var socket = io();

$('#rock').click(onc);
$('#paper').click(onc);
$('#scissors').click(onc);
$('#ready').click(function(){
	socket.emit('playerReady',1);
	$('#ready').attr('class','hidden');
});
      // $('form').submit(function(){
      //   socket.emit('chat message', $('#m').val());
      //   $('#m').val('');
      //   return false;
      // });
      // socket.on('chat message', function(msg){
      //   $('#messages').append($('<li>').text(msg));
      // });


function onc(evt) {
	socket.emit('sendplay',evt.target.id);
}

socket.on('roundState', function(state){
	if (state == 1)
		stageRound();

	if (state == 2)
		startRound();
});

socket.on('updateYourDisp', function(move) {
	setP1move(move);
});

socket.on('updateOppDisp', function(move) {
	setP2move(move);
});

function setP1move(move) {
  $('#AMoveDisp').attr('class','choice ' + move);
}

function setP2move(move) {
  $('#BMoveDisp').attr('class','choice ' + move);
}

function stageRound() {

	$('#ready').attr('class','');
}

function startRound() {
	setP1move('empty');
	setP2move('empty');
	circle.set(0);
		circle.animate(1.0, {
    		from: {color: startColor},
    		to: {color: endColor}
  	});

}

var startColor = '#FC5B3F';
var endColor = '#6FD57F';
var element = document.getElementById('progBar');
var circle = new ProgressBar.Circle(element, {
    color: startColor,
    trailColor: '#eee',
    trailWidth: 5,
    duration: 2000,
    strokeWidth: 5,

    // Set default step function for all animate calls
    step: function(state, circle) {
        circle.path.setAttribute('stroke', state.color);
    }
});

