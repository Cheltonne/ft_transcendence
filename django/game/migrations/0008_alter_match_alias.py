# Generated by Django 4.2.16 on 2024-09-19 16:03

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('game', '0007_match_timestamp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='match',
            name='alias',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='matches_as2', to=settings.AUTH_USER_MODEL),
        ),
    ]
