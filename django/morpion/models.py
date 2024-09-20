from django.db import models
from accounts.models import CustomUser

class Match(models.Model):
	player1 = models.ForeignKey(CustomUser, related_name='morpion_matches_as1', on_delete=models.CASCADE)
	player2 = models.ForeignKey(CustomUser, related_name='morpion_matches_as2', on_delete=models.CASCADE, null=True, blank=True)
	player1_score = models.IntegerField(null=True, blank=True)
	player2_score = models.IntegerField(null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='morpion_matches_won', on_delete=models.CASCADE, null=True, blank=True)
	timestamp = models.DateTimeField(auto_now_add=True)

	def set_winner(self):
		if self.player1_score is not None and self.player2_score is not None:
			if self.player1_score > self.player2_score:
				self.winner = self.player1
			elif self.player2_score > self.player1_score:
				self.winner = self.player2
			else:
				self.winner = None  # It's a draw
			self.save()  # Ensure the match instance is saved
class MatchAI(models.Model):
	player1 = models.ForeignKey(CustomUser, related_name='morpion_ai_matches', on_delete=models.CASCADE)
	player1_score = models.IntegerField(null=True, blank=True)
	ai_score = models.IntegerField(null=True, blank=True)
	WINNER_CHOICES = [
		('player1', 'Player 1'),
		('ai', 'AI'),
		('draw', 'Draw')
	]
	winner_type = models.CharField(max_length=10, choices=WINNER_CHOICES, null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='morpion_ai_matches_won', on_delete=models.CASCADE, null=True, blank=True)
	timestamp = models.DateTimeField(auto_now_add=True)

	def set_winner(self):
		if self.player1_score is not None and self.ai_score is not None:
			if self.player1_score > self.ai_score:
				self.winner = self.player1
				self.winner_type = 'player1'
			elif self.ai_score > self.player1_score:
				self.winner = None  # AI wins
				self.winner_type = 'ai'
			else:
				self.winner = None  # It's a draw
				self.winner_type = 'draw'
			self.save()
