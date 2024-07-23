import json
from morpion.models import Match, MatchAI
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db import models
from accounts.models import CustomUser
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist

def render_game(request):
    return render(request, 'morpion.html')

@csrf_exempt
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

@csrf_exempt
@login_required
def create_match(request):
    new_match = Match.objects.create(player1=request.user)
    return JsonResponse({'match_id': new_match.id})

@csrf_exempt
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

@csrf_exempt
@login_required
def create_match_ai(request):
    new_match = MatchAI.objects.create(player1=request.user)
    return JsonResponse({'match_id': new_match.id})


@csrf_exempt
def start_matchmaking(request):
    user = request.user
    online_users = CustomUser.objects.filter(is_online=True).exclude(id=user.id)
    
    potential_matches = online_users.annotate(
        game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                    Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
    ).order_by('game_count')

    if potential_matches.exists():
        player2 = potential_matches.first()
        match = Match.objects.create(player1=user, player2=player2)
        # Notify player2 for a match
        # You will need to implement a notification system using Django Channels or any other real-time framework
        return JsonResponse({"status": "Match found", "player2": player2.username})
    else:
        # No players available, propose game against AI
        return JsonResponse({"status": "No players available, start game with AI"})