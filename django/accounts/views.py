import json
from .models import CustomUser
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO

def index(request):
	return render(request, 'index.html')

@csrf_exempt
def user_signup(request):
	if request.method == 'POST':
		form = CustomUserCreationForm(request.POST, request.FILES)
		if form.is_valid():
			user = form.save(commit=False)
			if 'profile_picture' in request.FILES:
				image_file = request.FILES['profile_picture']
				img = Image.open(image_file)
				print(img.mode)
				if img.mode in ('P', 'RGBA'):
					img = img.convert('RGB')
					output = BytesIO()
					img.save(output, format='JPEG')
					output.seek(0)
					resized_image = resize_image(output, 500)
				else :
					resized_image = resize_image(image_file, 500)
				# Save the resized image to memory
				output = BytesIO()
				resized_image.save(output, format='JPEG', quality=75)
				output.seek(0)
				# Replace the original image file with the resized image
				user.profile_picture = InMemoryUploadedFile(output, 'ImageField', "%s.jpg" % image_file.name.split('.')[0],\
							'image/jpeg', output.tell(), None)
			user.save()
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
			request.session['is_authenticated'] = True  # Set flag in session
			return redirect('index')
	else:
		form = CustomAuthenticationForm()
	return render(request, 'registration/signin.html', {'form': form})

def user_logout(request):
	logout(request)
	return redirect('index')

def get_user_info(request):
	if request.user.is_authenticated:
		user = request.user
		user_info = {
				'username': user.username,
				'profile_picture': user.profile_picture.url,
				}
		return JsonResponse(user_info)
	else:
		return JsonResponse({'error': 'User is not authenticated.'})

def check_authenticated(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True})
    else:
        return JsonResponse({'authenticated': False})

def resize_image(image_file, max_width):
	image = Image.open(image_file)
	original_width, original_height = image.size
	aspect_ratio = original_width / original_height
	new_height = int(max_width / aspect_ratio)
	resized_image = image.resize((max_width, new_height), Image.LANCZOS)

	return resized_image
