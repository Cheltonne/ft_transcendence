/*
document.addEventListener('click', (event) => {
	if (!event.target.closest('.match-history-card') && document.querySelector('.match-history-cards').classList.contains('active')) {
		document.querySelector('.match-history-cards').classList.remove('active');
		document.querySelector('.match-history-veil').classList.remove('active');
		const matchHistoryCards = document.querySelector('.match-history-cards');
		matchHistoryCards.innerHTML = '';
	} else if (event.target.classList.contains('view-matches-link')) {
		renderUserProfile(userInfo);
		document.querySelector('.match-history-cards').classList.toggle('active');
		document.querySelector('.match-history-veil').classList.toggle('active');
	}
})

export function renderUserProfile(userInfo) {
	console.log("renderUserProfile() called.");
	if (userInfo.user_matches) {
		const matchHistoryCards = document.querySelector('.match-history-cards');
		matchHistoryCards.innerHTML = '';

		let i = 0;
		userInfo.user_matches.forEach(match => {
			const matchCard = document.createElement('div');
			matchCard.classList.add('match-history-card');
			matchCard.innerHTML = `
			<h1>Match ${++i}</h1>
			<b> Opponent </b> <p>CPU</p>
			<b> Winner </b> <p>${match.winner__username === userInfo.username ? match.winner__username : "CPU"}</p>
			<b> Score </b> <p>${userInfo.username}: ${match.user_score} - Opponent: ${match.alias_score}</p>
		`;
			matchHistoryCards.appendChild(matchCard);
		});
	}
}
*/