# Generated by Django 4.2.11 on 2024-04-29 19:48

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_customuser_profile_picture'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='matchup_history',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='score_history',
        ),
    ]
