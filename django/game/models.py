from django.db import models

class Score(models.Model):
    score = models.IntegerField()

    def __str__(self):
        return str(self.score)
