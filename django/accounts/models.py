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

class Notification(models.Model):
	type = models.TextField()
	sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications_sent')
	recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications_received')
	sender_pfp = models.TextField(null=True)
	message = models.TextField()
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	match_id = models.IntegerField(null=True)

	def __str__(self):
		return f'Notification for {self.user.username}: {self.message[:20]}'

	class Meta:
		ordering = ['-created_at']