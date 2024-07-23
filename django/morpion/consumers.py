import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.db import models
from django.db.models import Count
from .models import Match, MatchAI

User = get_user_model()

class MatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'matchmaking'
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
        data = json.loads(text_data)
        if data['type'] == 'matchmaking':
            match = await self.find_match()
            if match:
                match_data = await self.create_match(self.scope['user'], match)
                await self.channel_layer.send(
                    match.channel_name,
                    {
                        'type': 'match_request',
                        'player1': self.scope['user'].username,
                        'match_id': match_data.id
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'no_match_found',
                    'message': 'No players available. Starting game with AI.'
                }))
        elif data['type'] == 'match_accept':
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
        elif data['type'] == 'match_decline':
            match_id = data['match_id']
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
    def find_match(self):
        user = self.scope['user']
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
