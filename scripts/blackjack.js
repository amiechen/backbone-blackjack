$(function(){

		//Create a Card model
		var Card = Backbone.Model.extend({	
			//Every card has a suit, a num and a src for image, such as "{suit: "Club", num: 5, src: c5}"
			initialize: function() {
				var num = this.get("num");
				this.set("points",num < 11 ? num : 10);
			},
			defaults: {
				suit: "", 
				num: 0,
				src: "images/c1.png"
			}
		});
		
		//Create a Card view
		var CardView = Backbone.View.extend({
			tagName: "li",
			initialize: function(){
				this.render();
			},
			render: function() {
				var template = _.template($("#card-template").html(), this.model.toJSON());
				this.$el.html(template);
			}
		});
		
		//Create a Deck model	
		var Deck = Backbone.Collection.extend({
			model: Card,
			initialize: function(){
				
				//when a deck is created, it loop through Card model 52 times and print out each card
				for (var i=1; i<14; i++) {
					this.add({suit: "club", num: i, src: "images/c" + i + ".png"});//set attributes for each card
					this.add({suit: "heart", num: i, src: "images/h" + i + ".png"});
					this.add({suit: "spade", num: i, src: "images/s" + i + ".png"});
					this.add({suit: "diamond", num: i, src: "images/d" + i + ".png"});
				}
				this.shuffle();
				//console.log(this.toJSON());
			}, 
			shuffle: function(){				
				for (var i=0; i<100; i++) {
					// switch two randomly selected cards
					var cardA = Math.floor( this.length*Math.random() ),
						cardB = Math.floor( this.length*Math.random() ),
						tempcard = this.models[cardB]
					this.models[cardB] = this.models[cardA];
					this.models[cardA] = tempcard;
				}
			},
			
			draw: function (num){
				var drawnCards = [];
				//get the top n card of the deck --> add to Player.currentHand
				if (num > 1){
					for (i=0; i< num; i++){
						drawnCards.push(this.shift());		
					}
					return drawnCards;	
				} else {
					drawnCards.push(this.shift());
					return drawnCards;
				}
			}
		});
				
		//update the hand when player addCard
		//calculate the total
		var Hand = Backbone.Collection.extend({
			model: Card,
			initialize: function() {
				this.bind("add", this.log, this);
			},
			log: function(card) {
					console.log(card);
			}
		});
		
		//A Player can draw then addCard to his hand, and bet
		var Player = Backbone.Model.extend({
			initialize: function(){

			},
			defaults: {
				name: "AI",
				score: 0,
				money: 0,
				type: "AI"
			},
			score: function(){
				//this.set("score": this.reduce(this.get("num")));//what is this at this point?
			},
			endTurn: function(){
				
			}
		});
		
		var Players = Backbone.Collection.extend({
			model: Player,
			initialize: function() {
				this.bind("add", this.log, this);
			},
			log: function(player) {
				console.log(player);
			}
		})
		
		var PlayerView = Backbone.View.extend({
			tagName: "div",
			className: "player",
			template: _.template($("#player-template").html()),
			initialize: function(){
				this.render();
				this.model.bind("change", this.render, this);
				
			},
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));
				this.$el.append(new HandView({collection: this.model.get("currentHand")}).$el);
			}
		});
		
		//Handview to show list of cards in hand
		var HandView = Backbone.View.extend({
			tagName: "ul",
			initialize: function(){
				this.render();
				this.collection.bind("add", this.render, this);
				this.collection.bind("remove", this.render, this);
			},
			render: function(){
				view = this;
				view.$el.html("");
				view.collection.each(function(card) {
					var cardView = new CardView({model: card});
					view.$el.append(cardView.$el);	
				});
				
			}
		});

		
		//Create a Game model
		var Game = Backbone.Model.extend({
			defaults: {
				currentPlayer: 0
			},
			initialize: function(){
				this.deck = new Deck;
				this.players = new Players;
				this.players.add({name: "You", currentHand: new Hand(), money: 100, type: "human"});
				this.players.add({name: "AI", currentHand: new Hand(), money: 100, type: "AI"});
				this.players.add({name: "AI", currentHand: new Hand(), money: 100, type: "AI"});
				this.players.add({name: "Dealer", currentHand: new Hand(), type: "dealer"});
				this.deal();
				this.play();
			},
			deal: function() {
				var game = this;
				//deal two cards to each player
				
				this.players.forEach(function(person){				
					person.get("currentHand").add(game.deck.draw(2));
					person.set("score",game.getScore(person));
				});//each player add two top cards into his hand
			},
			hit: function() {
				var curPlayer = this.players.at(this.get("currentPlayer"));
				curPlayer.get("currentHand").add(this.deck.draw());
				var currentScore = this.getScore(curPlayer);
				curPlayer.set("score", currentScore);
				if(currentScore >= 21){
					//busted
					this.nextTurn();
				}
			},
			stand: function() {
				this.nextTurn();
				
			},
			play: function(){
				var curPlayer = this.players.at(this.get("currentPlayer"));
				if (curPlayer.get("type") === "AI" || curPlayer.get("type") === "dealer"){
					while(curPlayer.get("score") < 17) {
						this.hit();
					}
					this.stand();
				}
			},
			getScore: function(player) {
				var total = 0, aces = 0;
				player.get("currentHand").each(function (card) {
					var points = card.get("points");
					if(points===1){
						aces = aces + 1;
					}
					total = total + points;
				});
				total = aces*10 + total;
				while(aces > 0) {
					if(total <= 21){
						return total;
					}
					else {
						total = total - 10;
						aces = aces - 1;
					}
				}
				return total;
			},
			nextTurn: function() {
				var curPlayer = this.get("currentPlayer");
				curPlayer = curPlayer + 1;
				if(curPlayer > this.players.length - 1) {
					//game is over
					this.determineWinner();
				}
				else {
					this.set("currentPlayer", curPlayer);
					this.play();
				}
			},
			determineWinner: function() {
				var dealer = this.players.where({type: "dealer"})[0];
				var dealerScore = dealer.get("score"); 			
				function compareToDealer(playerScore, dealerScore){
					if(playerScore > 21) {
						return "BUST";
					} else if (!dealerScore) {
						return "";
					}
					else if (playerScore > dealerScore || dealerScore > 21) {
						return "WIN";
					} else if (playerScore === dealerScore) {
						return "PUSH";
					} else if (playerScore < dealerScore){
						return "LOSE";
					}
				}
				this.players.each(function (player) {
					var result;
					if (player.get("type") === "dealer") {
						result = compareToDealer(dealerScore)
					}
					else {
						var playerScore = player.get("score");
						result = compareToDealer(playerScore, dealerScore);
					}
					player.set("status",result);
				});
				
			}
		});

		
		//Create a Game view
		var GameView = Backbone.View.extend({
			el: jQuery(".mainApp"),
			tagName: "div",
			template: _.template($("#game-template").html()),
			initialize: function(){
				var game = this;
				game.model.bind("change:currentPlayer", this.showHideButton, game.model);
				game.$el.html(this.template(this.model.toJSON()));
				game.model.players.each(function (player){
    				var playerView = new PlayerView({model: player});
					game.$el.append(playerView.$el);
				});
			},
			events: {
					 "click button.hit": "hit",
					 "click button.stand": "stand"
			},
			hit: function() {
				this.model.hit();
			},
			stand: function() {
				this.model.stand();
			},
			showHideButton: function() {
				if (this.players.at(this.get("currentPlayer")).get("type") === "AI" || this.players.at(this.get("currentPlayer")).get("type") === "dealer") {
					$("button").hide();
				} else {
					$("button").show();
				}
			}
			
		});

		var gameView = new GameView({model:new Game});


});