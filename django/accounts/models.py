from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
	username = models.CharField(max_length=15, unique=True)
	profile_picture = models.ImageField(upload_to='profile_pictures')
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	friends = models.ManyToManyField('self', blank=True)
	online_devices_count = models.IntegerField(default=0)
	def __str__(self):
		return self.username
