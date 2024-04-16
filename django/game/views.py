import json
from .models import Score, CustomUser
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

def render_login_signup(request):
	return render(request, 'login-signup.html')

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = CustomUserCreationForm()
    return render(request, 'signup.html', {'form': form})

def login(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('login-signup')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'signin.html', {'form': form})

def logout(request):
    logout(request)
    return redirect('login')

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

