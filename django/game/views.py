import json
from game.models import Match
from accounts.models import CustomUser
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from accounts.utils import send_notification
from accounts.models import CustomUser

def save_score(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		player1_score = data.get('player1_score')
		player2_score = data.get('player2_score')
		match_id = data.get('match_id')
		if player1_score is None and player2_score is None and match_id is None :
			return JsonResponse({'error': 'Score value or match ID is missing.'},
				status=400)
		try:
			match = Match.objects.get(pk=match_id)
		except Match.DoesNotExist:
			return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)
		match.player1_score = player1_score
		match.player2_score = player2_score
		match.save()
		match.set_winner()
		match.save()
		return JsonResponse({'message': 'Score saved successfully.'})
	else:
		return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@login_required
def create_match(request):
	new_match = Match.objects.create(player1=request.user)
	return JsonResponse({'match_id': new_match.id})

def broadcast_tournament(request, p1, p2):
	print("broadcast_tournament view called")
	if request.method == 'GET':
		active_users = CustomUser.objects.all()
		admin = CustomUser.objects.get(id=2)
		for user in active_users:
			send_notification(admin, user, 'tournament_notice',
					  f"Tournament broadcast: {p1} is about to face {p2} in the ultimate tournament of DEATH try head!!!!!")
		print(f"received {p1} and {p2}")
		return JsonResponse({'message': 'Try succ HEAD'}, status=201)
	return JsonResponse({'message': 'Liar aHEAD'}, status=400)
	
def create_online_match(request):
	data = json.loads(request.body)
	player2_username = data.get('player2_username')
	player2 = CustomUser.objects.get(username=player2_username)
	new_match = Match.objects.create(player1=request.user, player2=player2)
	return JsonResponse({'match_id': new_match.id})