import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync
from accounts.models import Notification, Message, CustomUser
from django.db.models import Count
from accounts.utils import send_notification
from django.db import models

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
        type = data.get('type')
        
        if type == 'matchmaking':
            opponent = await self.find_match()
            if opponent:
                await self.send_match_request(opponent)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        else:        
            await self.send(text_data=json.dumps({
                'message': 'Notification'
            }))

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["notification"]))

    async def send_match_request(self, player2):
        print(f"Sending match request from {self.scope['user'].username} to {player2.username}.")
        await sync_to_async(send_notification)(
            sender = self.scope['user'],
            recipient = player2,
            type = 'match_request',
            message = f"{self.scope['user'].username} wants to play a morpion game with you.",
        )

    async def find_match(self):
        user = self.scope['user']
        print(f"Finding match for user: {user.username}")

        #who is online and not the current user
        online_users = await sync_to_async(
            lambda: CustomUser.objects.filter(online_devices_count__gt=0).exclude(id=user.id)
        )()
        
        count = await sync_to_async(online_users.count)()
        print(f"Potential matches: {count}")

        #who has the least amount of games with the current user
        potential_matches = await sync_to_async(
            lambda: online_users.annotate(
                game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                            Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
            ).order_by('game_count')
        )()

        if await sync_to_async(potential_matches.exists)():
            print(f"Match found: {await sync_to_async(lambda: potential_matches.first().username)()}")
            return await sync_to_async(potential_matches.first)()    
        return None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.room_name = f"user_{self.user.id}"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        recipient_id = text_data_json["recipient_id"]
        sender_id = text_data_json["sender_id"]

        try:
            recipient = await sync_to_async(CustomUser.objects.get)(id=recipient_id)
            blocked_users = await sync_to_async(list)(recipient.blocked_users.all())

            if self.user in blocked_users:
                return
            new_message = await sync_to_async(Message.objects.create)(
                sender=self.user, 
                recipient=recipient, 
                content=message
            )
            sender_profile_picture = self.user.profile_picture.url if self.user.profile_picture else None
            await self.channel_layer.group_send(
                f"chat_user_{recipient.id}",
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": self.user.username,
                    "sender_id": sender_id,
                    "timestamp": new_message.timestamp.isoformat(),
                    "sender_profile_picture": sender_profile_picture, 
                }
            )

        except CustomUser.DoesNotExist:
            await self.send(text_data=json.dumps({
                "error": "Recipient does not exist."
            }))

    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]
        sender_id = event["sender_id"]
        timestamp = event["timestamp"]
        sender_profile_picture = event.get("sender_profile_picture") 
        await self.send(text_data=json.dumps({
            "message": message,
            "sender": sender,
            "sender_id": sender_id,
            "timestamp": timestamp,
            "sender_profile_picture": sender_profile_picture,
        }))
