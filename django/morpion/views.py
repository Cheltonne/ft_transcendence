import json
from morpion.models import Match
from morpion.models import MatchAI
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

def render_game(request):
    return render(request, 'morpion.html')

@csrf_exempt
def save_score(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		player2_score = data.get('player2_score')
		player1_score = data.get('player1_score')
		match_id = data.get('match_id')
		if player2_score is None and player1_score is None and match_id is None :
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
		if ai_score is None and player1_score is None and match_id is None :
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
