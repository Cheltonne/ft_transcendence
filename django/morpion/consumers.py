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
        self.room_group_name = 'matchmaking'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"User {self.scope['user'].username} connected to matchmaking.")


    async def disconnect(self, close_code):
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

    async def handle_match_accept(self, data):
        try:
            match_id = data['match_id']
            match = await sync_to_async(Match.objects.get)(id=match_id)
            match.player2 = self.scope['user']
            await sync_to_async(match.save)()
            await self.channel_layer.send(
                match.player1.channel_name,
                {
                    'type': 'match_accepted',
                    'player2': self.scope['user'].username
                }
            )
        except Match.DoesNotExist:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Match not found.'
            }))

    async def handle_match_decline(self, data):
        try:
            match_id = data['match_id']
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
    

    async def send_match_request(self, match_data, player2):
        print(f"Sending match request from {self.scope['user'].username} to {player2.username}.")
        # Send a match request notification to Player 2 using the send_notification function
        await sync_to_async(send_notification)(
            sender=self.scope['user'],
            recipient=player2,
            type='match_request',
            message=f"{self.scope['user'].username} wants to play a game with you!"
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

"""class MatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'matchmaking'
        self.user = self.scope['user']

        if self.user.is_authenticated:
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
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'matchmaking':
                await self.handle_matchmaking()
            elif message_type == 'match_accept':
                await self.handle_match_accept(data)
            elif message_type == 'match_decline':
                await self.handle_match_decline(data)
        except Exception as e:
            print(f"Error in receive: {e}")

    async def handle_matchmaking(self):
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
            # Optionally start a match against AI
            match_ai = await self.create_match_ai(self.user)
            await self.send(text_data=json.dumps({
                'type': 'ai_match_started',
                'match_id': match_ai.id
            }))

    async def handle_match_accept(self, data):
        try:
            match_id = data['match_id']
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
        except Match.DoesNotExist:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Match not found.'
            }))

    async def handle_match_decline(self, data):
        try:
            match_id = data['match_id']
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

    @sync_to_async
    def create_match_ai(self, player1):
        return MatchAI.objects.create(player1=player1)"""