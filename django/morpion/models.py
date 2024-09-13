from django.db import models
from accounts.models import CustomUser
from django.db.models.signals import post_save
from django.dispatch import receiver

class Match(models.Model):
    player1 = models.ForeignKey(CustomUser, related_name='morpion_matches_as1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(CustomUser, related_name='morpion_matches_as2', on_delete=models.CASCADE, null=True, blank=True)
    player1_score = models.IntegerField(null=True, blank=True)
    player2_score = models.IntegerField(null=True, blank=True)
    winner = models.ForeignKey(CustomUser, related_name='morpion_matches_won', on_delete=models.CASCADE, null=True, blank=True)

    def set_winner(self):
        if self.player1_score is not None and self.player2_score is not None:
            if self.player1_score > self.player2_score:
                self.winner = self.player1
            elif self.player1_score < self.player2_score:
                self.winner = self.player2
            else:
                self.winner = None  # It's a draw, no winner
            post_save.disconnect(update_match_winner, sender=Match)
            self.save()
            post_save.connect(update_match_winner, sender=Match)

class MatchAI(models.Model):
    player1 = models.ForeignKey(CustomUser, related_name='morpion_ai_matches', on_delete=models.CASCADE)
    player1_score = models.IntegerField(null=True, blank=True)
    ai_score = models.IntegerField(null=True, blank=True)
    winner = models.ForeignKey(CustomUser, related_name='morpion_ai_matches_won', on_delete=models.CASCADE, null=True, blank=True)

    def set_winner(self):
        if self.player1_score is not None and self.ai_score is not None:
            if self.player1_score > self.ai_score:
                self.winner = self.player1
            else:
                self.winner = None  # It's a draw or AI won
            post_save.disconnect(update_match_ai_winner, sender=MatchAI)
            self.save()
            post_save.connect(update_match_ai_winner, sender=MatchAI)
            

@receiver(post_save, sender=Match)
def update_match_winner(sender, instance, **kwargs):
    instance.set_winner()

@receiver(post_save, sender=MatchAI)
def update_match_ai_winner(sender, instance, **kwargs):
    instance.set_winner()
