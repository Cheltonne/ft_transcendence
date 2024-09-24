from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset online devices count for all users'

    def handle(self, *args, **kwargs):
        User.objects.update(online_devices_count=0)
        self.stdout.write(self.style.SUCCESS('Successfully reset online devices count for all users.'))
