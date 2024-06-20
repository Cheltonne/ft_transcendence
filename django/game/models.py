from django.db import models
from django.db.models import F
from accounts.models import CustomUser

class Match(models.Model):
	player = models.ForeignKey(CustomUser, related_name='matches', on_delete=models.CASCADE)
	alias = models.TextField(blank=True, max_length=15)
	user_score = models.IntegerField(null=True, blank=True)
	alias_score = models.IntegerField(null=True, blank=True)
	winner = models.ForeignKey(CustomUser, related_name='matches_won', on_delete=models.CASCADE, null=True, blank=True)

	def set_winner(self):
		if self.user_score > self.alias_score:
			self.winner = self.player
			self.player.wins = F('wins') + 1 
			print(self.winner)
			self.player.save()
		else:
			print('No winner!')
			self.winner = None
			self.player.losses = F('losses') + 1 
			self.player.save()
