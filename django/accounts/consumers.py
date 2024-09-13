import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async, async_to_sync
from accounts.models import Notification, Message, CustomUser

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
        await self.send(text_data=json.dumps({
            'message': 'Notification'
        }))

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["notification"]))

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
            id = new_message.id
            sender_profile_picture = self.user.profile_picture.url if self.user.profile_picture else None
            await self.channel_layer.group_send(
                f"chat_user_{recipient.id}",
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": self.user.username,
                    "sender_id": sender_id,
                    "id": id,
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
        id = event["id"]
        timestamp = event["timestamp"]
        sender_profile_picture = event.get("sender_profile_picture") 
        await self.send(text_data=json.dumps({
            "message": message,
            "sender": sender,
            "sender_id": sender_id,
            "id": id,
            "timestamp": timestamp,
            "sender_profile_picture": sender_profile_picture,
        }))

class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.player_uuid = None
        self.room_name = None
        await self.accept()
        print(f'Client {self.player_uuid} connected')

    async def disconnect(self, close_code):
        # Broadcast to others that the player has left the room
        if self.room_name:
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'player_left',
                    'player_uuid': self.player_uuid,
                    'message': f'Player {self.player_uuid} has left the room.'
                }
            )

            
            if self.player_uuid in self.rooms.get(self.room_name, []):
                self.rooms[self.room_name].remove(self.player_uuid)

            
            if len(self.rooms.get(self.room_name, [])) == 1:
                await self.destroy_room(self.room_name)

        print(f'Client {self.player_uuid} disconnected')

        
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get('command')

        if command == 'create_room':
            await self.create_room(data['room_name'])
        elif command == 'set_player_name':
            self.player_uuid = data.get('player_name')
            print(f'Player name set to: {self.player_uuid}')
        elif command == 'start_button':
            await self.start_button()
        elif command == 'join_room':
            await self.join_room(data['room_name'])
        elif command == 'start_game':
            await self.start_game()
        elif command == 'destroy_room':
            await self.destroy_room(data['room_name'])
        elif command == 'move_paddle':
            await self.move_paddle(data['paddle_pos'])
        elif command == 'move_ball':
            ball_pos = data.get('ball_pos')
            ball_velocity = data.get('ball_velocity')
            if ball_pos is not None and ball_velocity is not None:
                await self.move_ball(ball_pos, ball_velocity)
            else:
                print("Error: Missing ball_pos or ball_velocity")
        elif command == 'update_score':
            score1 = data.get('score1')
            score2 = data.get('score2')
            player_uuid = data.get('player_uuid')
            if score1 is not None and score2 is not None and player_uuid is not None:
                await self.update_score(score1, score2, player_uuid)
            else:
                print("Error: Missing score1, score2, or player_uuid")

    async def create_room(self, room_name):
        if room_name in self.rooms:
            await self.send(text_data=json.dumps({
                'message': 'Room created'
            }))
        else:
            self.rooms[room_name] = [self.player_uuid]
            self.room_name = room_name
            await self.send(text_data=json.dumps({
                'message': 'Room created',
                'room_name': room_name
            }))
            print(f'Room {room_name} created by {self.player_uuid}')

    async def start_game(self):
        if self.room_name:
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'game_started',
                    'message': 'The game has started!'
                }
            )
            print(f'Game started in room {self.room_name}')
    
    async def start_button(self):
        await self.send(text_data=json.dumps({
            'type': 'start_button',
            'message': 'start_button'
        }))

    async def player_joined(self, event):
        player_uuid = event['player_uuid']
        player_number = event['player_number']
        await self.send(text_data=json.dumps({
            'message': f'Player {player_number} joined the room',
            'player_uuid': player_uuid,
            'player_number': player_number
        }))

    async def game_started(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))
    
    async def join_room(self, room_name):
        if room_name in self.rooms:
            if len(self.rooms[room_name]) < 3:
                self.rooms[room_name].append(self.player_uuid)
                self.room_name = room_name

                player_number = len(self.rooms[room_name])

                await self.send(text_data=json.dumps({
                    'message': 'Joined room',
                    'room_name': room_name,
                    'player_uuid': self.player_uuid,
                    'player_number': player_number
                }))
                await self.channel_layer.group_add(
                    self.room_name,
                    self.channel_name
                )
                print(f'{self.player_uuid} joined room {room_name} as Player {player_number}')

                await self.channel_layer.group_send(
                    self.room_name,
                    {
                        'type': 'player_joined',
                        'player_uuid': self.player_uuid,
                        'room_name': self.room_name,
                        'player_number': player_number
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'message': 'Room is full'
                }))
        else:
            await self.send(text_data=json.dumps({
                'message': 'Room does not exist'
            }))

    async def move_paddle(self, paddle_pos):
        if self.room_name:
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'paddle_moved',
                    'paddle_pos': paddle_pos,
                    'player_uuid': self.player_uuid
                }
            )

    async def paddle_moved(self, event):
        paddle_pos = event['paddle_pos']
        sender_uuid = event['player_uuid']
        await self.send(text_data=json.dumps({
            'command': 'move_paddle',
            'paddle_pos': paddle_pos,
            'sender_uuid': sender_uuid
        }))

    async def move_ball(self, ball_pos, ball_velocity):
        if self.room_name:
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'ball_moved',
                    'ball_pos': ball_pos,
                    'ball_velocity': ball_velocity
                }
            )

    async def ball_moved(self, event):
        ball_pos = event['ball_pos']
        ball_velocity = event['ball_velocity']
        await self.send(text_data=json.dumps({
            'command': 'move_ball',
            'ball_pos': ball_pos,
            'ball_velocity': ball_velocity
        }))

    async def update_score(self, score1, score2, player_uuid):
        if self.room_name:
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'score_updated',
                    'score1': score1,
                    'score2': score2,
                    'player_uuid': player_uuid
                }
            )

    async def score_updated(self, event):
        score1 = event['score1']
        score2 = event['score2']
        player_uuid = event['player_uuid']
        await self.send(text_data=json.dumps({
            'command': 'update_score',
            'score1': score1,
            'score2': score2,
            'player_uuid': player_uuid
        }))

    async def destroy_room(self, room_name):
        if room_name in self.rooms:
            for player_uuid in self.rooms[room_name]:
                await self.channel_layer.group_send(
                    room_name,
                    {
                        'type': 'room_destroyed',
                        'message': f'Room {room_name} has been destroyed.'
                    }
                )

            del self.rooms[room_name]
            print(f'Room {room_name} has been destroyed and all players removed.')

            await self.channel_layer.group_discard(
                room_name,
                self.channel_name
            )
        else:
            await self.send(text_data=json.dumps({
                'message': 'Room does not exist or has already been destroyed.'
            }))

    async def room_destroyed(self, event):
        await self.send(text_data=json.dumps({
            'command': 'room_destroyed',
            'message': event['message']
        }))