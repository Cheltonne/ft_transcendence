import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync
from accounts.models import Notification, Message, CustomUser
from morpion.models import Match
from django.db.models import Count
from accounts.utils import send_notification
from django.db import models
from channels.layers import get_channel_layer
import asyncio


User = get_user_model()

PING_TIMEOUT = 5

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

        if self.user.is_authenticated:
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
        print(f"User {self.user.username} marked online, online count: {self.user.online_devices_count}")

    @sync_to_async
    def mark_user_offline(self):
        # Fetch the latest user instance from the database before updating
        self.user.refresh_from_db()
        if self.user.online_devices_count > 0:
            self.user.online_devices_count -= 1
            self.user.save()
            print(f"User {self.user.username} marked offline, online count: {self.user.online_devices_count}")

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
        self.opponent = None
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
            self.opponent = await self.find_match()
            if self.opponent:
                await self.send_match_request(self.opponent)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        else:        
            await self.send(text_data=json.dumps({
                'message': 'Notification'
            }))

    async def receive_notification(self, event):
        if event['notification']['type'] == 'match_request_accepted':
            print(f"Notification type is: {event['notification']['type']} and player2 is:\
               {event['notification']['sender']}")
            await self.send(text_data=json.dumps(event['notification']))
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

        online_users = await sync_to_async(
            lambda: list(CustomUser.objects.filter(online_devices_count__gt=0).exclude(id=user.id))
        )()

        for online_user in online_users:
            await sync_to_async(online_user.refresh_from_db)()

        online_users = [user for user in online_users if user.online_devices_count > 0]

        count = len(online_users)
        print(f"Potential matches (online after refresh): {count}")

        if count == 0:
            return None

        potential_matches = await sync_to_async(
            lambda: CustomUser.objects.filter(id__in=[user.id for user in online_users]).annotate(
                game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                        Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
            ).order_by('game_count')
        )()

        if await sync_to_async(lambda: potential_matches.exists())():
            match_user = await sync_to_async(lambda: potential_matches.first())()
            print(f"Match found: {match_user.username}")
            return match_user


    """async def find_match(self):
        Ping users and return the first one who responds with a pong.
        user = self.scope['user']
        print(f"Finding match for user: {user.username}")

        # Step 1: Find online users excluding the current user
        online_users = await sync_to_async(
            lambda: list(CustomUser.objects.filter(online_devices_count__gt=0).exclude(id=user.id))
        )()

        # Refresh users from the database to ensure they are still online
        for online_user in online_users:
            await sync_to_async(online_user.refresh_from_db)()

        # Filter out users who are no longer online after refresh
        online_users = [user for user in online_users if user.online_devices_count > 0]

        print(f"Potential matches (online after refresh): {len(online_users)}")

        if not online_users:
            print("No online users found.")
            return None

        # Step 2: Ping each online user and return the first one who responds with a pong
        for potential_match in online_users:
            is_online = await self.ping_user(potential_match)
            if is_online:
                print(f"Match found: {potential_match.username}")
                return potential_match

        print("No responsive match found.")
        return None

    async def ping_user(self, user):
        Ping the user and wait for a pong response within a timeout period.
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'user_{user.id}',
            {
                'type': 'ping',
                'message': 'ping',
            }
        )

        try:
            # Step 3: Wait for the pong response with a timeout
            pong = await asyncio.wait_for(self.wait_for_pong(user), timeout=PING_TIMEOUT)
            if pong:
                print(f"Received pong from {user.username}")
                return True
        except asyncio.TimeoutError:
            print(f"Timeout waiting for pong from {user.username}")
            return False

    async def wait_for_pong(self, user):
        Wait for a pong message from the user.
        pong_future = asyncio.Future()

        # Create a method to handle the pong
        def pong_handler(event):
            if event['type'] == 'pong' and event['user_id'] == user.id:
                pong_future.set_result(True)

        # Register the pong handler for WebSocket messages
        self.scope['pong_handler'] = pong_handler

        # Wait for the pong response
        return await pong_future
    
    # Ping handler: Handle the 'ping' message type and respond with 'pong'
    async def ping(self, event):
        user = self.scope['user']
        # Send pong message back to the group
        await self.channel_layer.group_send(
            f"user_{user.id}",
            {
                'type': 'pong',
                'user_id': user.id,
                'message': 'pong'
            }
        )"""    
  

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
