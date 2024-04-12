from django.db import models
from django.contrib.auth.models import AbstractUser

class Score(models.Model):
	score = models.IntegerField()
	def __str__(self):
		return str(self.score)

class CustomUser(AbstractUser):
	matchup_history = models.TextField(blank=True)
	score_history = models.TextField(blank=True)
	profile_picture = models.ImageField(upload_to='profile_pictures', blank=True)
	def __str__(self):
		return self.username
