import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.db import models
from django.db.models import Count
from morpion.models import Match, MatchAI

User = get_user_model()

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'users_online'
        self.user = self.scope['user']

        if self.user.is_authenticated:
            await self.mark_user_online()
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_friend_online',
                    'id': self.user.id,
                    'username': self.user.username,
                    'is_online': True
                }
            )

    async def disconnect(self, close_code):
        self.room_group_name = 'users_online'
        self.user = self.scope['user']
        await self.mark_user_offline()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'new_friend_offline',
                'id': self.user.id,
                'username': self.user.username,
                'is_online': False
            }
        )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def new_friend_online(self, event):
        id = event['id']
        user = await sync_to_async(User.objects.get)(id=id) 
        username = event['username']
        is_online = user.online_devices_count != 0

        await self.send(text_data=json.dumps({
            'type': 'new_friend_online',
            'username': username,
            'is_online': is_online
        }))

    async def new_friend_offline(self, event):
        id = event['id']
        user = await sync_to_async(User.objects.get)(id=id) 
        username = event['username']
        is_online = user.online_devices_count != 0

        await self.send(text_data=json.dumps({
            'type': 'new_friend_offline',
            'username': username,
            'is_online': is_online
        }))

    @sync_to_async
    def mark_user_online(self):
        # Fetch the latest user instance from the database before updating
        self.user.refresh_from_db()
        self.user.online_devices_count += 1
        self.user.save()

    @sync_to_async
    def mark_user_offline(self):
        # Fetch the latest user instance from the database before updating
        self.user.refresh_from_db()
        self.user.online_devices_count -= 1
        self.user.save()

    @sync_to_async
    def get_online_users(self):
        return list(User.objects.filter(online_devices_count__gt=0).values_list('username', flat=True))

    @sync_to_async
    def find_match(self):
        user = self.user
        online_users = User.objects.filter(online_devices_count__gt=0).exclude(id=user.id)

        potential_matches = online_users.annotate(
            game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                        Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
        ).order_by('game_count')

        if potential_matches.exists():
            return potential_matches.first()
        return None
    
    @sync_to_async
    def create_match(self, player1, player2):
        return Match.objects.create(player1=player1, player2=player2)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'matchmaking':
            match = await self.find_match()
            if match:
                match_data = await self.create_match(self.user, match)
                await self.channel_layer.send(
                    match.channel_name,
                    {
                        'type': 'match_request',
                        'player1': self.user.username,
                        'match_id': match_data.id
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        elif message_type == 'match_accept':
            match_id = text_data_json.get('match_id')
            match = await sync_to_async(Match.objects.get)(id=match_id)
            match.player2 = self.user
            await sync_to_async(match.save)()
            await self.channel_layer.send(
                match.player1.channel_name,
                {
                    'type': 'match_accepted',
                    'player2': self.user.username
                }
            )
        elif message_type == 'match_decline':
            match_id = text_data_json.get('match_id')
            match = await sync_to_async(Match.objects.get)(id=match_id)
            match.delete()
            await self.send(text_data=json.dumps({
                'type': 'match_declined',
                'message': 'The match was declined. Searching for another match...'
            }))
            await self.receive(json.dumps({'type': 'matchmaking'}))

    async def match_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_request',
            'player1': event['player1'],
            'match_id': event['match_id']
        }))

    async def match_accepted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_accepted',
            'player2': event['player2']
        }))

    @sync_to_async
    def is_user_online(self, username):
        try:
            user = User.objects.get(username=username)
            return user.online_devices_count != 0
        except User.DoesNotExist:
            return False

    @sync_to_async
    def get_online_users(self):
        return list(User.objects.filter(online_devices_count!=0).values_list('username', flat=True))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )
