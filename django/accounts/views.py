import json
from PIL import Image
from io import BytesIO
from .forms import CustomUserCreationForm, CustomAuthenticationForm, CustomUserChangeForm
from .models import CustomUser, Notification
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
from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from .serializers import CustomUserSerializer, NotificationSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .utils import send_friend_request_notification,\
request_already_sent, is_already_friends_with_recipient, send_notification

def index(request):
    return render(request, 'index.html')

from django.shortcuts import redirect

def logout_required(function):
    def wrap(request, *args, **kwargs):
        if request.user.is_authenticated:
            return JsonResponse({ 'response: "You\'re already logged in!"' })
        else:
            return function(request, *args, **kwargs)
    return wrap


def user_logout(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully!'})

def get_user_info(request):
    if request.user.is_authenticated:
        user = request.user
        user_matches = list(user.matches.all().order_by('id').values('alias', 'user_score', 'alias_score', 'winner__username'))
        user_info = {
                'username': user.username,
                'profile_picture': user.profile_picture.url,
                'user_matches': user_matches,
                'wins': user.wins,
                'losses': user.losses,
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
            user.profile_picture = InMemoryUploadedFile(output, 'ImageField', "%s.jpg" % image_file.name.split('.')[0],\
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

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()

    @action(detail=True, methods=['post'])
    def add_friend(self, request, pk=None):
        user = request.user
        friend = get_object_or_404(CustomUser, pk=pk)
        user.friends.add(friend)
        user.save()
        send_notification(user, friend, 'friend_request_accepted', f'{user} accepted your friend request!')
        return Response({'detail': 'Friend added successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_friend(self, request, pk=None):
        user = request.user
        friend = get_object_or_404(CustomUser, pk=pk)
        user.friends.remove(friend)
        user.save()
        return Response({'detail': 'Friend removed successfully'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_friends(self, request):
        user = request.user
        friends = user.friends.all()
        serializer = CustomUserSerializer(friends, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='by-username/(?P<username>[^/.]+)')
    def get_user_by_username(self, request, username=None):
        try:
            user = CustomUser.objects.get(username=username)
            ret = {'id': user.id, 'username': user.username}
            return Response(ret, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND) 

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        recipient_username = request.data.get('username')
        try:
            recipient = CustomUser.objects.get(username=recipient_username)
            if request_already_sent(request.user, recipient) is True:
                return Response({'detail': f'You\'ve already sent {recipient_username} a friend request!'})
            elif is_already_friends_with_recipient(request.user, recipient) is True:
                return Response({'detail': f'You\'re already friends with {recipient}!'})
            send_friend_request_notification(request.user, recipient)
            return Response({'detail': 'Friend request sent successfully.'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(recipient=user).order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = self.request.user
        unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
        return Response({'unread_count': unread_count})


@api_view(['PUT'])
def mark_as_read(request, id):
    if request.method != 'PUT':
        return Response({'Error': 'Only PUT requests allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    try:
        notification = Notification.objects.get(id=id)
        serializer = NotificationSerializer(notification, context={'request': request})
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification, context={'request': request}).data)
    except Notification.DoesNotExist:
        return Response ({'Error': 'Error fetching notification. + ratio'})
    