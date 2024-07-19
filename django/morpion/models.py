from django.db import models
from accounts.models import CustomUser

class Match(models.Model):
	player1 = models.ForeignKey(CustomUser, related_name='morpion_matches_as1', on_delete=models.CASCADE)
	player2 = models.ForeignKey(CustomUser, related_name='morpion_matches_as2', on_delete=models.CASCADE, null=True, blank=True)
	player1_score = models.IntegerField(null=True, blank=True)
	player2_score = models.IntegerField(null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='morpion_matches_won', on_delete=models.CASCADE, null=True, blank=True)

	def set_winner(self):
		if self.player1_score > self.player2_score:
			self.winner = self.player1
			print(self.winner)
		else:
			print('No winner!')
			self.winner = self.player2

class MatchAI(models.Model):
	player1 = models.ForeignKey(CustomUser, related_name='morpion_ai_matches', on_delete=models.CASCADE)
	player1_score = models.IntegerField(null=True, blank=True)
	ai_score = models.IntegerField(null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='morpion_ai_matches_won', on_delete=models.CASCADE, null=True, blank=True)

	def set_winner(self):
		if self.player1_score > self.ai_score:
			self.winner = self.player1
			print(self.winner)
		else:
			print('No winner!')
			self.winner = self.ai
