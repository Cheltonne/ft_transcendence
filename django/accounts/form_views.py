import json
from PIL import Image
from io import BytesIO
from .forms import CustomUserCreationForm, \
CustomAuthenticationForm, CustomUserChangeForm
from .models import CustomUser, Notification, Message
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.template.loader import render_to_string
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from .serializers import CustomUserSerializer, \
NotificationSerializer, MessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .utils import send_friend_request_notification,\
request_already_sent, is_already_friends_with_recipient, send_notification

def logout_required(function):
    def wrap(request, *args, **kwargs):
        if request.user.is_authenticated:
            return JsonResponse({ 'response: "You\'re already logged in!"' })
        else:
            return function(request, *args, **kwargs)
    return wrap

@logout_required
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
            user.profile_picture = InMemoryUploadedFile(output,\
             'ImageField', "%s.jpg" % image_file.name.split('.')[0],\
            'image/jpeg', output.tell(), None)
        elif not 'profile_picture' in request.FILES:
            user.profile_picture = 'default_pfp/waifu.jpg'
        else:
            return JsonResponse({'success': False, 'errors': form.errors.as_json()})
        user.save()
        login(request, user)
        return JsonResponse({'success': True, 'message': 'Signup successful!'})
    else:
      return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
@ensure_csrf_cookie
def render_update_form(request):
    if request.method == "GET":
        form = CustomUserChangeForm(instance=request.user)
        context = {"form": form}
        template = render_to_string('registration/update.html', context=context)
        return JsonResponse({"form": template})
    elif request.method == "POST":
        form = CustomUserChangeForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            instance = form.save(commit=False)
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
                instance.profile_picture = InMemoryUploadedFile(output, 'ImageField', "%s.jpg" % image_file.name.split('.')[0],\
                'image/jpeg', output.tell(), None)
            instance.save()
            return JsonResponse({'success': True, 'message': 'Update successful!'})
        else:
            return JsonResponse({'success': False, 'errors': form.errors.as_json()})
    else:
      return JsonResponse({'success': False, 'message': 'Invalid request method'})

@logout_required
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

