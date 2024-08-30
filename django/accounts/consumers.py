import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync
from accounts.models import Notification
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

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            await self.channel_layer.group_add(
                f'user_{self.user.id}',
                self.channel_name
            )
            await self.accept()


    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
                f'user_{self.user.id}',
                self.channel_name
            )


    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'notification':
            await self.send(text_data=json.dumps({
                'message': 'Notification'
            }))
        elif data['type'] == 'match_request':
            await self.handle_match_request(data)

   
    async def handle_match_request(self, data):
        print (f"Match request data in notification class: {data}")
        await self.channel_layer.group_send(
            f'user_{self.user.id}',
            {
                'type': 'send_notification',
                'notification': {
                    'type': 'match_request',
                    'player1': data['player1'],
                    'match_id': data['match_id'],
                    'message': f"{data['player1']} wants to play with you."
                }
            }
            
        )


    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["notification"]))