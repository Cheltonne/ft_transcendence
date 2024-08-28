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
    async def connect(self):
        self.match_id = None  # Initialize match_id to None
        self.room_group_name = 'matchmaking'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"User {self.scope['user'].username} connected to matchmaking.")


    async def disconnect(self, close_code):
        if self.match_id:
            await self.channel_layer.group_discard(
                f'morpion_match_{self.match_id}',
                self.channel_name
            )
        else:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            print(f"User {self.scope['user'].username} disconnected from matchmaking.")

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'matchmaking':
            match = await self.find_match()
            if match:
                match_data = await self.create_match(self.scope['user'], match)
                self.match_id = match_data.id  # Set the match_id
                await self.send_match_request(match_data, match)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        
        elif data['type'] == 'match_accept':
            await self.handle_match_accept(data)

        elif data['type'] == 'match_decline':
            await self.handle_match_decline(data)

        elif data['type'] == 'make_move':
            await self.handle_make_move(data)

    async def handle_match_accept(self, data):
        try:
            match_id = data.get('match_id')
            match = await sync_to_async(Match.objects.get)(id=match_id)
            match.player2 = self.scope['user']
            await sync_to_async(match.save)()

            self.match_id = match_id
            self.room_group_name = f'morpion_match_{match_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'match_accepted',
                    'player2': self.scope['user'].username,
                    'match_id': self.match_id
                }
            )
        except Match.DoesNotExist:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Match not found.'
            }))

    async def handle_match_decline(self, data):
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
        await sync_to_async(send_notification)(
            sender=self.scope['user'],
            recipient=player2,
            type='match_request',
            message=f"{self.scope['user'].username} wants to play a game with you!",
            match_id=match_data.id
        )

    @sync_to_async
    def find_match(self):
        user = self.scope['user']
        print(f"Finding match for user: {user.username}")
        online_users = User.objects.filter(online_devices_count__gt=0).exclude(id=user.id)
        print(f"Potential matches: {online_users.count()}")

        potential_matches = online_users.annotate(
            game_count=Count('morpion_matches_as1', filter=models.Q(morpion_matches_as1__player2=user)) +
                        Count('morpion_matches_as2', filter=models.Q(morpion_matches_as2__player1=user))
        ).order_by('game_count')

        if potential_matches.exists():
            print(f"Match found: {potential_matches.first().username}")
            return potential_matches.first()
        print("No match found")    
        return None

    @sync_to_async
    def create_match(self, player1, player2):
        return Match.objects.create(player1=player1, player2=player2)
        print(f"Match created with ID: {match.id}")
        return match
    
    @sync_to_async
    def create_match_ai(self, player1):
        match_ai = MatchAI.objects.create(player1=player1)
        print(f"AI Match created with ID: {match_ai.id}")
        return match_ai