import json
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from PIL import Image
from .models import CustomUser
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO
from django.template.loader import render_to_string
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import serializers, status
from rest_framework.response import Response
from .serializers import LoginSerializer

def index(request):
	return render(request, 'index.html')

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
				output = BytesIO()
				resized_image.save(output, format='JPEG', quality=75)
				output.seek(0)
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

@ensure_csrf_cookie
def render_signin_form(request):
	if request.method == "GET":
		form = CustomAuthenticationForm()
		context = {
			"form": form,
		}
		template = render_to_string('registration/signin.html', context=context)
		ret1 = template.replace('\t', '')
		ret2 = ret1.replace('\n', '')
		return JsonResponse({"form": ret2})

class LoginView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated requests

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

class SignInSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class SignInView(APIView):
    def get(self, request):
        form = CustomAuthenticationForm()
        serializer = SignInSerializer(form)
        return Respons(serializer.data)

class CustomUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        label=('Username'),
        required=True,
        max_length=15,
        style={
            "input_type": "text",
            "autofocus": False,
            "autocomplete": "off",
            "required": True,
        },
        error_messages={
            "required": "This field is required.",
            "blank": "Username is required.",
        },
    )
