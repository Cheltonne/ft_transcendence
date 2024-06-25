export class MorpionComponent extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open'});
		this.shadowRoot.innerHTML = `
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"/>
		<style>
			@import url('${this.getAttribute('css-url')}');
		</style>
		<div class="container">
			<div id="alert-placeholder"></div>
			<h1 class="text-center pt-5">Morpion des familles</h1>
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-8 d-flex justify-content-center">
						<div class="board" id="board">
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
							<div class="cell" data-cell></div>
						</div>
					</div>
					<div class="col-4 d-flex justify-content-center align-items-center">
						<div class="d-grid gap-2">
							<button id="scorePlayer1" type="button" class="btn btn-info">Player 1</button>
							<button id="scorePlayer2" type="button" class="btn btn-warning">Player 2</button>
						</div>
					</div>
				</div>
			</div>
			<div class="d-grid gap-2 col-6 mx-auto"> 
				<button id="newGame" type="button" class="btn btn-success">Start New Game</button>  
				<button id="matchmakingButton" type="button" class="btn btn-primary">Start Matchmaking</button>
				<button id="newGameWithComputer" type="button" class="btn btn-secondary">Start New Game with Computer</button>
			</div> 
			<div class="winning-message" id="winningMessage">
				<div data-winning-message-text></div>
				<button id="restartButton" type="button" class="btn btn-dark btn-lg">Restart</button>
			</div>   
		</div>
	`;
	}

}