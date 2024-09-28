from django.db import models
from django.db.models import F
from accounts.models import CustomUser

class Match(models.Model):
	player1 = models.ForeignKey(CustomUser, related_name='matches', 
						on_delete=models.CASCADE)
	player2 = models.ForeignKey(CustomUser, related_name='matches_as2', on_delete=models.CASCADE, null=True, blank=True) 
	player1_score = models.IntegerField(null=True, blank=True)
	player2_score = models.IntegerField(null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='matches_won',
						on_delete=models.CASCADE, null=True, blank=True)
	timestamp = models.DateTimeField(auto_now_add=True)

	def set_winner(self):
		if self.player1_score > self.player2_score:
			self.winner = self.player1
			self.player1.wins = F('wins') + 1 
			self.player1.save()
			if self.player2:
				self.player2.losses = F('losses') + 1 
				self.player2.save()
		elif self.player2_score > self.player1_score:
			self.winner = self.player2
			self.player1.losses = F('losses') + 1 
			self.player1.save()
			if self.player2:
				self.player2.wins = F('wins') + 1 
				self.player2.save()
		else:
			self.winner = None