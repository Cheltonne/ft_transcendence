# Generated by Django 4.2.16 on 2024-09-25 10:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0020_alter_customuser_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='matchmaking_online_count',
            field=models.IntegerField(default=0),
        ),
    ]
