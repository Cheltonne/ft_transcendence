from django.shortcuts import render

from django.http import JsonResponse
from .models import Score
import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def save_score(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		score_value = data.get('score')
		if score_value is not None:
			# Save the score to the database
			score = Score.objects.create(score=score_value)
			return JsonResponse({'message': 'Score saved successfully.'})
		else:
			return JsonResponse({'error': 'Score value is missing.'}, status=400)
	else:
		return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

