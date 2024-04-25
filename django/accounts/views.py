import json
from .models import CustomUser
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from django.http import JsonResponse

def index(request):
	return render(request, 'index.html')

@csrf_exempt
def user_signup(request):
	if request.method == 'POST':
		form = CustomUserCreationForm(request.POST, request.FILES)
		if form.is_valid():
			user = form.save()
			login(request, user);
			return redirect('index')
	else:
		form = CustomUserCreationForm()
	return render(request, 'registration/signup.html', {'form': form})

def user_login(request):
	if request.method == 'POST':
		form = CustomAuthenticationForm(request, request.POST)
		if form.is_valid():
			login(request, form.get_user())
			return redirect('index')
	else:
		form = CustomAuthenticationForm()
	return render(request, 'registration/signin.html', {'form': form})

def user_logout(request):
	logout(request)
	return redirect('index')

def check_auth(request):
	authenticated = request.user.is_authenticated
	return JsonResponse({'authenticated': authenticated})

def get_user_info(request):
	if request.user.is_authenticated:
		user = request.user
		user_info = {
				'username': user.username,
				}
		return JsonResponse(user_info)
	else:
		return JsonResponse({'error': 'User is not authenticated bruh'})
