import json
from django.db import models
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.db.models import Count
from .models import Match, MatchAI
from channels.layers import get_channel_layer
from accounts.utils import send_notification


User = get_user_model()

class MatchmakingConsumer(AsyncWebsocketConsumer):

    #match_id = {}
    
    async def connect(self):
        self.player_uuid = self.scope['user'].username
        self.room_name = None
        self.room_group_name = 'matchmaking'
        await self.accept()
        print(f"User {self.player_uuid} connected to matchmaking.")


    async def disconnect(self, close_code):
        if self.match_id in self.room_group_name:
            self.room_group_name[self.match_id].remove(self.player_uuid)
            if not self.room_group_name[self.match_id]:
                del self.room_group_name[self.match_id]
        print(f"User {self.player_uuid} disconnected from matchmaking.")

    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Received data: {data}")
        type = data.get('type')
        
        if data['type'] == 'matchmaking':
            match = await self.find_match()
            if match:
                match_data = await self.create_match(self.scope['user'], match)
                self.match_id = match_data.id
                print(f"Match ID before sent: {self.match_id}")
                await self.send_match_request(match_data, match)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        
        if type == 'match_accept':
            await self.handle_match_accepted()

        elif type == 'match_decline':
            await self.handle_match_decline(data)
                                                                                                                                                                                                                          
        elif type == 'join_room':
            await self.handle_join_room(data)

        elif type == 'make_move':
            await self.handle_make_move(data)

    async def handle_match_accepted(self):
        print('in handle_match_accepted')
        #match_id = data.get('match_id')
        #print(f"Match ID in handle match: {match_id}")
        
        match = await sync_to_async(Match.objects.get)(id=self.match_id)
        print(f"Handling match accepted for match ID: {self.match_id}")
        
        # Create a room with the match_id as the room name
        self.room_name = f"room_{self.match_id}"
        self.room_group_name = self.room_name

        # Add both players to the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.channel_layer.group_send(
             self.room_group_name,
            {
                'type': 'room_created',
                'message': f"Room {self.room_name} created for the match.",
                'player1': match.player1.username,
                'player2': match.player2.username,
                'match_id': self.match_id
             }
        )

        await self.send(text_data=json.dumps({
            'type': 'room_created',
            'message': "Room {self.room_name} created.",
            'match_id': self.match_id,
            'player1': match.player1.username,
            'player2': match.player2.username,

        }))
        print(f"Room {self.room_name} created for Match ID: {self.match_id}")
    

    async def handle_join_room(self, room_name):
        # Check if the room exists
        if room_name in self.channel_layer.groups:
            # Retrieve the match associated with the room_name (which is the match_id)
            match = await sync_to_async(Match.objects.get)(id=room_name)
        
            # Count the number of players already in the room
            current_players = await self.get_room_player_count(room_name)

            if current_players < 2:  # Assuming a max of 2 players in a room
                # Add the current player to the room
                await self.channel_layer.group_add(
                    room_name,
                    self.channel_name
                )
                self.room_name = room_name

                player_number = current_players + 1  # Assign player number based on the order of joining

                # Send a message back to the player confirming they've joined the room
                await self.send(text_data=json.dumps({
                    'type': 'room_joined',
                    'message': 'Joined room',
                    'room_name': room_name,
                    'player_uuid': self.player_uuid,
                    'player_number': player_number
                }))

                print(f'{self.player_uuid} joined room {room_name} as Player {player_number}')

                # Broadcast to the group that a new player has joined
                await self.channel_layer.group_send(
                    room_name,
                    {
                        'type': 'player_joined',
                        'player_uuid': self.player_uuid,
                        'room_name': room_name,
                        'player_number': player_number
                    }
                )
            else:
                # Room is full, send an error message to the player
                await self.send(text_data=json.dumps({
                    'message': 'Room is full'
                }))
        else:
            # Room does not exist, send an error message to the player
            await self.send(text_data=json.dumps({
            'message': 'Room does not exist'
            }))

    @sync_to_async
    def get_room_player_count(self, room_name):
        match = Match.objects.get(id=room_name)
        count = 0
        if match.player1:
            count += 1
        if match.player2:
            count += 1
        return count
      
    async def handle_match_decline(self, data):
        print('in handle_match_decline')
        try:
            match_id = data.get('match_id')
            match = await sync_to_async(Match.objects.get)(id=match_id)
            match.delete()
            await self.send(text_data=json.dumps({
                'type': 'match_declined',
                'message': 'The match was declined. Searching for another match...'
            }))
            await self.receive(json.dumps({'type': 'matchmaking'}))
        except Match.DoesNotExist:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Match not found.'
            }))
    

    async def handle_make_move(self, data):
        cell_index = data['cell']
        player_class = data['player']

        # Broadcast the move to both players in the match room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_move',
                'cell': cell_index,
                'player': player_class,
            }
        )

    async def game_move(self, event):
         # Send the move to WebSocket clients
        await self.send(text_data=json.dumps({
            'action': 'make_move',
            'cell': event['cell'],
            'player': event['player'],
        }))


    async def send_match_request(self, match_data, player2):
        print(f"Sending match request from {self.scope['user'].username} to {player2.username}.")
        print(f"Match ID: {match_data.id}") 
        await sync_to_async(send_notification)(
            sender = self.scope['user'],
            recipient = player2,
            type = 'match_request',
            message = f"{self.scope['user'].username} wants to play a game with you in match {match_data.id}.",
            match_id = match_data.id
        )
        

    async def find_match(self):
        user = self.scope['user']
        print(f"Finding match for user: {user.username}")

        # Use sync_to_async to handle ORM queries
        online_users = await sync_to_async(
            lambda: User.objects.filter(online_devices_count__gt=0).exclude(id=user.id)
        )()
        
        count = await sync_to_async(online_users.count)()
        print(f"Potential matches: {count}")

        potential_matches = await sync_to_async(
            lambda: online_users.annotate(
                game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                            Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
            ).order_by('game_count')
        )()

        if await sync_to_async(potential_matches.exists)():
            print(f"Match found: {await sync_to_async(lambda: potential_matches.first().username)()}")
            return await sync_to_async(potential_matches.first)()
        else:
            await self.send(text_data=json.dumps({
                'type': 'no_match_found',
                'message': 'No players available. Starting game with AI.'
            })) 
            print("No match found")    
        return None
    

    @sync_to_async
    def create_match(self, player1, player2):
        match = Match.objects.create(player1=player1, player2=player2)
        print(f"Match created with ID: {match.id}")
        return match
    
    @sync_to_async
    def create_match_ai(self, player1):
        match_ai = MatchAI.objects.create(player1=player1)
        print(f"AI Match created with ID: {match_ai.id}")
        return match_ai