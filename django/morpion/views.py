import json
from morpion.models import Match, MatchAI
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db import models
from django.db.models import Count
from accounts.models import CustomUser
from django.core.exceptions import ObjectDoesNotExist

def render_game(request):
    return render(request, 'morpion.html')

def save_score(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        player2_score = data.get('player2_score')
        player1_score = data.get('player1_score')
        match_id = data.get('match_id')

        if player2_score is None or player1_score is None or match_id is None:
            return JsonResponse({'error': 'Score value or match ID is missing.'}, status=400)

        try:
            match = Match.objects.get(pk=match_id)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)

        match.player2_score = player2_score
        match.player1_score = player1_score
        match.set_winner()
        match.save()
        return JsonResponse({'message': 'Score saved successfully.'})
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@login_required
def create_match(request): #rajout de player1...avois s'il faut le retirer (ouais ne fonctionne pas)
    data = json.loads(request.body)
    player2 = Match.objects.get(player2=data.get("player2"))
    #player1 = Match.objects.get(player1=data.get("player1"))
    new_match = Match.objects.create(player1=request.user, player2=player2) #, player1=player1)
    return JsonResponse({'match_id': new_match.id})

def save_score_ai(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        ai_score = data.get('ai_score')
        player1_score = data.get('player1_score')
        match_id = data.get('match_id')

        if ai_score is None or player1_score is None or match_id is None:
            return JsonResponse({'error': 'Score value or match ID is missing.'}, status=400)

        try:
            match = MatchAI.objects.get(pk=match_id)
        except MatchAI.DoesNotExist:
            return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)

        match.ai_score = ai_score
        match.player1_score = player1_score
        match.set_winner()
        match.save()
        return JsonResponse({'message': 'Score saved successfully.'})
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@login_required
def create_match_ai(request):
    new_match = MatchAI.objects.create(player1=request.user)
    return JsonResponse({'match_id': new_match.id})


"""@login_required
def start_matchmaking(request):
    user = request.user
    online_users = CustomUser.objects.filter(is_online=True).exclude(id=user.id)
    
    potential_matches = online_users.annotate(
        game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                    Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
    ).order_by('game_count')

    if potential_matches.exists():
        player2 = potential_matches.first()
        new_match = Match.objects.create(player1=user, player2=player2) 
        return JsonResponse({
            "status": "Match found", 
            "player2": player2.username,
            "match_id": new_match.id})

    else:
        match_ai = MatchAI.objects.create(player1=user)
        return JsonResponse({"status": "No players available, start game with AI"})"""
