import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import WebsocketConsumer
from .user_tracker import UserTracker
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()

class tagrossemere(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'users_online'
        self.user = self.scope['user']
        self.user.friends_online = set()

        if self.user.is_authenticated:
            # Add user to tracker
            await sync_to_async(UserTracker.add_user)(self.user.username)
            self.user.is_online = True
            await sync_to_async(self.user.save)()

            # Add user's friends who are online
            friends = await sync_to_async(list)(self.user.friends.all())
            for friend in friends:
                if friend.username in await sync_to_async(UserTracker.get_users)():
                    self.user.friends_online.add(friend.username)

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            # Notify group about new user list
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_list',
                    'users': await sync_to_async(list)(UserTracker.get_users()),
                    'friends_online': list(self.user.friends_online)
                }
            )

    async def disconnect(self, close_code):
        # Remove user from tracker and update status
        self.user = self.scope['user']
        await sync_to_async(UserTracker.remove_user)(self.user.username)
        self.user.is_online = False
        await sync_to_async(self.user.save)()

        # Notify group about user leaving
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status_change',
                'username': self.user.username,
                'is_online': False
            }
        )
        await self.channel_layer.group_discard(
            self.room_group_name, 
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def user_list(self, event):
        users = event['users']
        friends_online = event['friends_online']
        
        # Send friends list to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_list',
            'friends_online': friends_online
        }))