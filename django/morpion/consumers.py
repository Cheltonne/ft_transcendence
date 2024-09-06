import json
from django.db import models
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.db.models import Count
from .models import Match, MatchAI
from channels.layers import get_channel_layer
from accounts.utils import send_notification
from accounts.models import CustomUser


User = get_user_model()

class MatchmakingConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.player_uuid = self.scope['user'].username
        self.room_name = None
        self.room_group_name = 'matchmaking'
       # print(f"This is the channel name: {self.channel_name}")
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        #print(f"User {self.player_uuid} connected to matchmaking.")


    async def disconnect(self, close_code):
        # Remove the user from the matchmaking group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # If there's a room associated with this match, remove the user from that room as well
        if self.room_name:
            await self.channel_layer.group_discard(
                self.room_name,
                self.channel_name
        )
        #print(f"User {self.player_uuid} disconnected from matchmaking.") 

        ##########################################################################
        #                                                                        #
        #                    RECEIVE METHOD AND HANDLERS                         # 
        #                                                                        #
        ##########################################################################     

    async def receive(self, text_data):
        data = json.loads(text_data)
        #print(f"Received data: {data}")
        type = data.get('type')
        
        if data['type'] == 'matchmaking':
            match = await self.find_match()
            if match:
                match_data = await self.create_match(self.scope['user'], match)
                self.match_id = match_data.id
                #print(f"Match ID before sent: {self.match_id}")
                await self.send_match_request(match_data, match)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'COUCOU. No players available. Starting game with AI.'
                }))
        
        if type == 'match_accept':
            await self.handle_match_accepted(data)

        elif type == 'match_decline':
            await self.handle_match_declined(data)
        
        elif type == 'make_move':
            await self.handle_make_move(data)
        
        elif type == 'p2_join_room':
            await self.p2_join_room(data)

        ##########################################################################
        #                                                                        #
        #                         ACCEPTED MATCH LOGIC                           # 
        #                                                                        #
        ##########################################################################  

    async def handle_match_accepted(self, data):
        #print('in handle_match_accepted')
        match_id = data.get('match_id')
        username = data.get('username')
        #print(f"Match ID in handle match: {match_id}")
        match = await sync_to_async(Match.objects.get)(id=match_id)
        match_attributes = await sync_to_async(lambda: {field.name: getattr(match, field.name) for field in match._meta.fields})()
        player1_id = str(match_attributes.get('player1'))
        player2_id = str(match_attributes.get('player2'))
        self.match_room_name = f"room_{match_id}"

        await self.channel_layer.group_add(
            self.match_room_name,
            self.channel_name
        )
        if username == player2_id:
            await self.channel_layer.group_send(
                'matchmaking',
                {
                    'type': 'invite_player_to_room',
                    'message': {
                        'room_name': self.match_room_name,
                        'match_id': match_id,
                        'player1': player1_id,
                        'player2': player2_id,
                    }
                }
            )
        """print(f"Room {self.room_name} created for Match ID: {match_id}")
        print(f"Players: {player1_id}, {player2_id}")"""
        
        message_to_send = {
            'type': 'match_accepted',
            'message': 'match_accepted',
            'room_name': self.match_room_name,
            'match_id': match_id,
            'player1': player1_id,
            'player2': player2_id
        }
#        print(f"Message to send: {message_to_send}")
        await self.channel_layer.group_send(
                self.match_room_name,
                {
                    'type': 'match_accepted',
                    "message": message_to_send,
                }
            )

    async def invite_player_to_room(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_accepted',
            'message': event['message']
        }))
        self.match_room_name = event['message']['room_name']
        if self.player_uuid == event['message']['player2'] or\
            self.player_uuid == event['message']['player1']:
            await self.channel_layer.group_add(
                self.match_room_name,
                self.channel_name
            )
            print(f"Player {self.scope['user'].username} joined room {self.match_room_name}")

    async def p2_join_room(self, data):
        self.match_room_name = data.get('room_name')
        await self.channel_layer.group_add(
            self.match_room_name,
            self.channel_name
        )
        
        await self.channel_layer.group_send(
            self.match_room_name,
            {
                'type': 'Les_toilettes_secretes_de_42',
                "message": f"{self.scope['user'].username} joined room {self.match_room_name}",
            }
        )

    async def Les_toilettes_secretes_de_42(self, event): #testing handler method w/ funny name, meant to see if only p1 and p2 are in the match room
        print(f"{self.scope['user'].username} is in room {self.match_room_name}")
        await self.send(text_data=json.dumps({
                'type': 'player_joined',
                'message': event['message']
            })) 

    async def match_accepted(self, event):
        """     
        print('Room created event received in consumers before send to front end')
        print("Received match_accepted event:", event)
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'match_accepted',
                'message': event['message']
            }))
            print("Message sent to frontend successfully.")
        except Exception as e:
            print(f"Error sending message to frontend: {e}")

        
        ##########################################################################
        #                                                                        #
        #                         DECLINED MATCH LOGIC                           # 
        #                                                                        #
        ##########################################################################  


    async def handle_match_declined(self, data):
        print('in handle_match_declined')
        match_id = data.get('match_id')
        match = await sync_to_async(Match.objects.get)(id=match_id)
        print(f"Match ID in handle match: {match_id}")
        
        await sync_to_async (match.delete)()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'match_declined',
                'message': 'The match was declined. Searching for another match...'
            }
        )
        print("Match declined message sent to the group")

    async def match_declined(self, event):
        print('in match_declined before send to front end')
        await self.send(text_data=json.dumps({
            'type': 'match_declined',
            'message': event['message']
        }))

        ##########################################################################
        #                                                                        #
        #                             GAME LOGIC                                 # 
        #                                                                        #
        ##########################################################################  

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


        ##########################################################################
        #                                                                        #
        #                         FIND MATCH LOGIC                               # 
        #                                                                        #
        ##########################################################################  


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

        online_users = await sync_to_async(
            lambda: CustomUser.objects.filter(online_devices_count__gt=0).exclude(id=user.id)
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
                'message': 'SALUT. No players available. Starting game with AI.'
            })) 
            print("No match found")    
        return None
    
        
        ##########################################################################
        #                                                                        #
        #                         CREATE A MATCH                                 # 
        #                                                                        #
        ##########################################################################  
    
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