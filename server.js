var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = [];
var rooms = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '\\public\\index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket){
	newPlayer(socket);

	socket.on('sendplay', function(play){
  		makePlay(socket,play);
    //io.emit('chat message', msg);
	});

	socket.on('playerReady', function(state) {
		if (state == 1) {
			socket.room.readyPlayer(socket);
			console.log(socket.id + ': READY');
		}
	});

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


function newPlayer(socket) {
	if (!rooms.length)
		rooms.push(newRoom());

	for (var i = 0; i < rooms.length; i++) { //Find room with less than 2 people
		if (!rooms[i].hasPlayers()) {
			rooms[i].addPlayer(socket);
			socket.room = rooms[i];
			console.log(socket.id + ': Entered Room #' + i + ' as Player #' + rooms[i].players.length);
			break;
		} else if (i == (rooms.length - 1)) { //If none found in Rooms[], create a new. Player will be added next forloop iteration
			rooms.push(newRoom());
		}
	}

	if (socket.room.hasPlayers()) { //Are there enough players to begin?
		socket.room.currentRound().stageRound();
	}

}


function newRoom() {
	var room = {
		players: [],
		rounds: [], //initialize with first round
		p1: 0,
		p2: 0,
		hasPlayers: function() { //check if room has 2 players
			return (this.players.length == 2) ? true : false;
		},
		addPlayer: function(player) {
			this.players.push(player);
		},
		addRound: function() {
			this.rounds.push(newRound(this));
		},
		currentRound: function() {
			return this.rounds[this.rounds.length-1];
		},
		emit: function(eventType, data) {
			this.players.forEach(function(socket) {
				io.to(socket.id).emit(eventType, data);
			});
		},
		readyPlayer: function(socket) { 
			this.players.forEach(function(p,i) {
				if (p === socket) {
					//console.log(i + ' ' + this.p1);
					if (i == 0) {
						this.p1 = 1;
					} else {
						this.p2 = 1;
					}
				}
			}, this);
			if (this.p1 && this.p2) {
				this.currentRound().startRound();
			}
		}
	}
	room.addRound();
	return room;
}

function sys(msg) {
	console.log('SYSTEM: ' + msg);
};

function newRound(room) {
	var round = {
		room: room,
		p1: 0,
		p2: 0,
		winner: 0,
		start: 0,
		state: 0, //0 initialized, 1 = ready to go pending user, 2 = active, 3 = done
		findWinner: function() {
			if (this.p1 == this.p2)
				return true;

			if (this.p1 == 'rock')
				return (this.p2 == 'paper') ? 2 : 1;

			if (this.p1 == 'paper')
				return (this.p2 == 'scissors') ? 2 : 1;

			if (this.p1 == 'scissors')
				return (this.p2 == 'rock') ? 2 : 1;
		},
		stageRound: function() {
			this.state = 1;
			this.room.emit('roundState',1);
			console.log('round STAGED');
		},
		startRound: function() {
			this.start = Date.now();
			this.state = 2;
			this.room.emit('roundState',2);
			console.log('round BEGIN');
			var scope = this;
			setTimeout(function() {

				//Send final plays to player 1
				io.to(scope.room.players[0].id).emit('updateYourDisp', scope.p1);
				io.to(scope.room.players[0].id).emit('updateOppDisp', scope.p2);

				//Send final plays to player 2
				io.to(scope.room.players[1].id).emit('updateYourDisp', scope.p2);
				io.to(scope.room.players[1].id).emit('updateOppDisp', scope.p1);
				
				scope.winner = scope.findWinner();
				if (scope.winner === 1)
					console.log('player 1 wins!');
				
				if (scope.winner === 2)
					console.log('player 2 wins!');

				if (scope.winner === true)
					console.log('TIE');

				if (scope.p1 === 0)
					scope.p1 = 'empty';

				if (scope.p2 === 0)
					scope.p2 = 'empty';

				scope.room.addRound();
				scope.room.currentRound().stageRound();


			}, 2300);
		},
		endRound: function() { //duplicate of code above but could not pass scope through setTimeout call
			// this.winner = this.findWinner();
			// console.log('winnah: ' + _this.winner);
			// if (this.winner === 1)
			// 	console.log('player 1 wins!');
			
			// if (this.winner === 2)
			// 	console.log('player 2 wins!');

			// if (this.winner === true)
			// 	console.log('TIE');

		},
		checkMoveTime: function(time) {
			return ((time - this.start) > 2000) ? false : true; 
		}

	}
	return round;
}

function RPS(p1,p2) { //implement up in round.findWinner
	if (p1 == p2)
		return true;

	if (p1 == 'rock')
		return (p2 == 'paper') ? 2 : 1;

	if (p1 == 'paper')
		return (p2 == 'scissors') ? 2 : 1;

	if (p1 == 'scissors')
		return (p2 == 'rock') ? 2 : 1;
}


function makePlay(socket, play) {
	var player = socket.room.players.indexOf(socket);
	var room = socket.room;
	var currentRound = room.rounds[room.rounds.length - 1];
	var time = Date.now();
	if (currentRound.checkMoveTime(time)) {
		if (player == 0) {
			currentRound.p1 = play;
			console.log('Player 1 successfully played ' + play);
		} else {
			currentRound.p2 = play;
			console.log('Player 2 successfully played ' + play);
		}
		io.to(socket.id).emit('updateYourDisp',play);
	}


}


