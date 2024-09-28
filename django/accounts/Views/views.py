from ..models import CustomUser, Message
from django.http import JsonResponse
from django.contrib.auth import logout
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from rest_framework.decorators import action
from rest_framework.views import APIView
from ..serializers import CustomUserSerializer, \
MessageSerializer
from ..utils import send_friend_request_notification,\
request_already_sent, is_already_friends_with_recipient, send_notification

def index(request):
    return render(request, 'index.html')

def user_logout(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully!'})

def get_user_info(request):
    if request.user.is_authenticated:
        user = request.user
        user_matches = list(user.matches.all().order_by('id').values
                ('alias', 'user_score', 'alias_score', 'winner__username', 'timestamp'))
        user_morpion_matches = list(user.morpion_matches_as1.all().order_by('id').values
                ('player1__username', 'player2__username', 'player1_score', 'player2_score',
                  'winner__username', 'timestamp'))
        user_morpion_ai_matches = list(user.morpion_ai_matches.all().order_by('id').values
                ('player1__username', 'player1_score', 'ai_score', 'winner__username',
                'timestamp'))
        user_info = {
                'username': user.username,
                'profile_picture': user.profile_picture.url,
                'user_matches': user_matches,
                'morpion_matches': user_morpion_matches,
                'morpion_ai_matches': user_morpion_ai_matches,
                'wins': user.wins,
                'losses': user.losses,
                'id': user.id,
        }
        return JsonResponse(user_info)
    else:
        return JsonResponse({'error': 'User is not authenticated.'})

def check_authenticated(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True})
    else:
        return JsonResponse({'authenticated': False})

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def add_friend(self, request, pk=None):
        user = request.user
        friend = get_object_or_404(CustomUser, pk=pk)
        user.friends.add(friend)
        user.save()
        send_notification(user, friend, 'friend_request_accepted', \
        f'{user} accepted your friend request!')
        return Response({'detail': 'Friend added successfully'}, \
        status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_friend(self, request, pk=None):
        user = request.user
        friend = get_object_or_404(CustomUser, pk=pk)
        user.friends.remove(friend)
        user.save()
        return Response({'detail': 'Friend removed successfully'}, \
        status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_friends(self, request):
        user = request.user
        friends = user.friends.all()
        serializer = CustomUserSerializer(friends, many=True, \
        context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='by-username/(?P<username>[^/.]+)')
    def get_user_by_username(self, request, username=None):
        try:
            user = CustomUser.objects.get(username=username)
            ret = {'id': user.id, 'username': user.username}
            return Response(ret, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found'}, \
            status=status.HTTP_404_NOT_FOUND) 

    @action(detail=False)
    def users_except_current(self, request):
        user = request.user
        users = CustomUser.objects.exclude(id=user.id)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_user_pfp(self, request):
            user_id = request.query_params.get('user_id') 
            if not user_id:
                return Response({"error": "user_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            user = get_object_or_404(CustomUser, id=user_id)
            if not user.profile_picture:
                return Response({"error": "User does not have a profile picture"}, status=status.HTTP_404_NOT_FOUND)
            profile_picture_url = request.build_absolute_uri(user.profile_picture.url)
            return Response({"profile_picture_url": profile_picture_url}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='user-info')
    def get_user_info(self, request, pk=None):
        user = self.get_object()  # Retrieves the specific user by ID (pk)
        
        user_matches = \
        list(user.matches.all().order_by('id').values('alias', 'user_score',
            'alias_score', 'winner__username', 'timestamp'))
        user_morpion_matches = \
        list(user.morpion_matches_as1.all().order_by('id').values(
            'player1__username', 'player2__username', 'player1_score',
            'player2_score', 'winner__username', 'timestamp'))
        user_morpion_ai_matches = \
        list(user.morpion_ai_matches.all().order_by('id').values(
            'player1__username', 'player1_score', 'ai_score', 'winner__username',
            'timestamp'))
        
        user_info = {
            'id': user.id,
            'username': user.username,
            'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
            'user_matches': user_matches,
            'morpion_matches': user_morpion_matches,
            'morpion_ai_matches': user_morpion_ai_matches,
            'wins': user.wins,
            'losses': user.losses,
        }
        return Response(user_info)

    @action(detail=True, methods=['post'], url_path='block-user')
    def block_user(self, request, pk=None):
        try:
            current_user = request.user
            user_to_block = self.get_object()
            if user_to_block not in current_user.blocked_users.all():
                current_user.block_user(user_to_block)
                return Response({"message": f"{user_to_block.username} has been blocked."}, status=status.HTTP_200_OK)
            return Response({"error": "User is already blocked!"}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='unblock-user')
    def unblock_user(self, request, pk=None):
        try:
            current_user = request.user
            user_to_unblock = self.get_object()
            if user_to_unblock in current_user.blocked_users.all():
                current_user.unblock_user(user_to_unblock)
                return Response({"message": f"{user_to_unblock.username} has been unblocked."}, status=200)
            return Response({"error": "User isn't blocked!"}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='profile-info')
    def get_user_profile_info(self, request, pk=None):
        user = self.get_object()
        data = {
            'username': user.username,
            'id': user.id,
            'wins': user.wins,
            'losses': user.losses,
            'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
        }
        return Response(data)

    @action(detail=True, methods=['get'], url_path='profile')
    def retrieve_user(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(user)
        user_matches = list(user.matches.all().order_by('id').values
                ('alias', 'user_score', 'alias_score', 'winner__username', 'timestamp'))
        user_morpion_matches = list(user.morpion_matches_as1.all().order_by('id').values
                ('player1__username', 'player2__username', 'player1_score', 'player2_score',
                  'winner__username', 'timestamp'))
        user_morpion_ai_matches = list(user.morpion_ai_matches.all().order_by('id').values
                ('player1__username', 'player1_score', 'ai_score', 'winner__username',
                'timestamp'))
        response_data = serializer.data
        response_data['user_matches'] = user_matches
        response_data['morpion_matches'] = user_morpion_matches
        response_data['morpion_ai_matches'] = user_morpion_ai_matches
        return Response(response_data)

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        recipient_username = request.data.get('username')
        try:
            recipient = CustomUser.objects.get(username=recipient_username)
            if request_already_sent(request.user, recipient) is True:
                return Response({'detail': \
                f'You\'ve already sent {recipient_username} a friend request!'})
            elif is_already_friends_with_recipient(request.user, recipient) is True:
                return Response({'detail': f'You\'re already friends with {recipient}!'})
            send_friend_request_notification(request.user, recipient)
            return Response({'detail': \
            'Friend request sent successfully.'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': \
            'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        recipient_id = self.request.query_params.get('recipient_id') 
        try:
            recipient = CustomUser.objects.get(id=recipient_id)
            blocked_users = user.blocked_users.all()
        except CustomUser.DoesNotExist:
            return Message.objects.none()

        return Message.objects.filter(
            (Q(sender=user, recipient=recipient)) |
            (Q(sender=recipient, recipient=user) & ~Q(sender__in=blocked_users))
        ).order_by('timestamp')
    