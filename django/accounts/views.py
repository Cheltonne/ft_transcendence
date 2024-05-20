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
from django.contrib.auth import authenticate

def index(request):
    return render(request, 'index.html')

def user_logout(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully!'})

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
        context = {"form": form}
        template = render_to_string('registration/signin.html', context=context)
        return JsonResponse({"form": template})
    elif request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        form = AuthenticationForm(request, data={'username': username, 'password': password})
        if form.is_valid():
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({'success': True, 'message': 'Login successful!'})
        else:
            form.add_error(None, 'Invalid username or password')
            return JsonResponse({'success': False, 'message': 'Invalid credentials'})
        context = {"form": form}
        return render(request, "registration/signin.html", context)

@ensure_csrf_cookie
def render_signup_form(request):
  if request.method == "GET":
    form = CustomUserCreationForm()
    context = {"form": form}
    template = render_to_string('registration/signup.html', context=context)
    return JsonResponse({"form": template})
  elif request.method == "POST":
    form = CustomUserCreationForm(request.POST, request.FILES)
    if form.is_valid():
        user = form.save(commit=False)
        if 'profile_picture' in request.FILES:
            image_file = request.FILES['profile_picture']
            img = Image.open(image_file)
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
        login(request, user)
        return JsonResponse({'success': True, 'message': 'Signup successful!'})
    else:
        return JsonResponse({'success': False, 'errors': form.errors.as_json()})
  else:
    return JsonResponse({'success': False, 'message': 'Invalid request method'})