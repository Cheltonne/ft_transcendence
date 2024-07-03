# Generated by Django 4.2.13 on 2024-07-03 14:10

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('game', '0005_alter_match_player_alter_match_winner'),
    ]

    operations = [
        migrations.AlterField(
            model_name='match',
            name='player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='match',
            name='winner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='matches_won', to=settings.AUTH_USER_MODEL),
        ),
    ]
