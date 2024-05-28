import json
from game.models import Match
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
		alias_value = data.get('alias_score')
		user_score = data.get('user_score')
		match_id = data.get('match_id')
		if alias_value is None and user_score is None and match_id is None :
			return JsonResponse({'error': 'Score value or match ID is missing.'}, status=400)
		try:
			match = Match.objects.get(pk=match_id)
		except Match.DoesNotExist:
			return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)
		match.alias_score = alias_value
		match.user_score = user_score
		match.set_winner()
		match.save()
		return JsonResponse({'message': 'Score saved successfully.'})
	else:
		return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@csrf_exempt
@login_required
def create_match(request):
	new_match = Match.objects.create(player=request.user)
	return JsonResponse({'match_id': new_match.id})
