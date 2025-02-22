# Generated by Django 5.0.6 on 2024-07-01 21:56

from django.db import migrations
from django.contrib.auth import get_user_model
from game.models import Match
from accounts.models import CustomUser

def create_initial_customusers(apps, schema_editor):
    CustomUser = get_user_model()
    Match = apps.get_model('game', 'Match')

    user1 = CustomUser.objects.create(
        username='chajaxus',
        password='user4242',
        email='user1@example.com',
        wins=15,
        losses=5,
        profile_picture='default_pfp/waifu.jpg',
    )

    user2 = CustomUser.objects.create(
        username='phaslanus',
        password='user4242',
        email='user2@example.com',
        wins=7,
        losses=3,
        profile_picture='default_pfp/waifu.jpg',
    )

    user1.friends.add(user2)
    
    #match = Match.objects.create(
     #   player = user1,
      #  alias = 'aliasus',
       # user_score = 2,
        #alias_score = 0,
        #winner = user1
    #)
    #user1.matches.add(match)

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_remove_customuser_is_online_and_more'),
        ('game', '0005_alter_match_player_alter_match_winner'),
    ]

    operations = [
    ]
