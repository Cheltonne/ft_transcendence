# Generated by Django 4.2.13 on 2024-06-20 16:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_customuser_friends_customuser_losses_customuser_wins'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='losses',
            field=models.IntegerField(default=21),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='wins',
            field=models.IntegerField(default=42),
        ),
    ]
