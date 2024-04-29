from django.db import models

class Match(models.Model):
	player = models.ForeignKey(CustomUser, related_name='matches', on_delete=models.CASCADE)
	alias = models.TextField(blank=True, max_length=15)
	user_score = models.IntegerField()
	alias_score = models.IntegerField()
	winner = models.ForeignKey(CustomUser, related_name='matches_won', on_delete=models.CASCADE, null=True, blank=True)

	def save(self, *args, **kwargs):
        if self.user_score > self.alias_score:
            self.winner = self.player
        else:
            self.winner = None  # No winner if scores are equal or opponent wins
        super().save(*args, **kwargs)