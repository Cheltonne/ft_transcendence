from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class CustomUser(AbstractUser):
	username = models.CharField(max_length=11, unique=True)
	matchup_history = models.TextField(blank=True)
	score_history = models.TextField(blank=True)
	profile_picture = models.ImageField(upload_to='profile_pictures')
	def __str__(self):
		return self.username
