from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
	username = models.CharField(max_length=15, unique=True)
	profile_picture = models.ImageField(upload_to='profile_pictures')
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	friends = models.ManyToManyField('self', blank=True)
	online_devices_count = models.IntegerField(default=0)
	matchmaking_online_count = models.IntegerField(default=0)
	blocked_users = models.ManyToManyField('self', symmetrical=False, 
									related_name='blockers')

	def __str__(self):
		return self.username
		
	def block_user(self, user_to_block):
		self.blocked_users.add(user_to_block)

	def unblock_user(self, user_to_unblock):
		self.blocked_users.remove(user_to_unblock)

class Notification(models.Model):
	type = models.TextField()
	sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
							related_name='notifications_sent')
	recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE,
							related_name='notifications_received')
	sender_pfp = models.TextField(null=True)
	message = models.TextField()
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'Notification for {self.user.username}: {self.message[:20]}'

	class Meta:
		ordering = ['-created_at']

class Message(models.Model):
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
							related_name='sent_messages')
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
							related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.sender} -> {self.recipient}: {self.content[:20]}'