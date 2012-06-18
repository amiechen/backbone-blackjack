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
				money: 0
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
			initialize: function(){
				this.$el.append(new HandView({collection: this.model.get("currentHand")}).$el);
			},
			render: function(){
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
			initialize: function(){
				this.deck = new Deck;
				this.players = new Players;
				this.players.add({name: "AI", currentHand: new Hand(), money: 100});
				this.players.add({name: "Dealer", currentHand: new Hand()});
				this.currentPlayer = 0;
				this.deal();
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
				var curPlayer = this.players.at(this.currentPlayer);
				curPlayer.get("currentHand").add(this.deck.draw());
				var currentScore = this.getScore(curPlayer);
				if(currentScore >= 21){
					//busted
					this.nextTurn();
				}
			},
			stand: function() {
				this.nextTurn();
				
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
					if(total < 21){
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
				this.currentPlayer = this.currentPlayer + 1;
				if(this.currentPlayer > this.players.length - 1) {
					//game is over
					determineWinner();
				}
			},
			determineWinner: function() {}
		});

		
		//Create a Game view
		var GameView = Backbone.View.extend({
			el: jQuery(".mainApp"),
			tagName: "div",
			template: _.template($("#game-template").html()),
			initialize: function(){
				var game = this;
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
			}
			
		});

		var gameView = new GameView({model:new Game});


});