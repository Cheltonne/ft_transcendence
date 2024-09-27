import json
from morpion.models import Match, MatchAI
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from accounts.models import CustomUser
from accounts.serializers import CustomUserSerializer
from accounts.utils import send_notification
def render_game(request):
    return render(request, 'morpion.html')

def save_score(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        player2_score = data.get('player2_score')
        player1_score = data.get('player1_score')
        match_id = data.get('match_id')

        if player2_score is None or player1_score is None or match_id is None:
            return JsonResponse({'error': 'Score value or match ID is missing.'}, status=400)

        try:
            match = Match.objects.get(pk=match_id)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)

        match.player2_score = player2_score
        match.player1_score = player1_score
        match.set_winner()
        match.save()
        return JsonResponse({'message': 'Score saved successfully.'})
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@login_required
def create_match(request):
    new_match = Match.objects.create(player1=request.user)
    return JsonResponse({'match_id': new_match.id})

@login_required
def create_matchmacking_match(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        print(f"data: {data}")
        player2_username = data.get('player2')
        player2 = CustomUser.objects.get(username=player2_username)
        print(f"Player 2: {player2_username}")
        match = Match.objects.create(player1=request.user, player2=player2)
        return JsonResponse({'match_id': match.id})
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

def save_score_ai(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        ai_score = data.get('ai_score')
        player1_score = data.get('player1_score')
        match_id = data.get('match_id')

        if ai_score is None or player1_score is None or match_id is None:
            return JsonResponse({'error': 'Score value or match ID is missing.'}, status=400)

        try:
            match = MatchAI.objects.get(pk=match_id)
        except MatchAI.DoesNotExist:
            return JsonResponse({'error': 'Invalid match ID provided.'}, status=400)

        match.ai_score = ai_score
        match.player1_score = player1_score
        match.set_winner()
        match.save()
        return JsonResponse({'message': 'Score saved successfully.'})
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

@login_required
def create_match_ai(request):
    new_match = MatchAI.objects.create(player1=request.user)
    return JsonResponse({'match_id': new_match.id})

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='match_accept')
    def match_accept(self, request, pk=None):
        user = request.user
        opponent = get_object_or_404(CustomUser, pk=pk)

        send_notification(user, opponent, 'match_request_accepted', \
        f'{user} accepted your match request!')
        return Response({'detail': 'Match accepted'}, \
        status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def match_declined(self, request, pk=None):
        user = request.user
        opponent = get_object_or_404(CustomUser, pk=pk)

        send_notification(user, opponent, 'match_request_declined', \
        f'{user} declined your match request!')
        return Response({'detail': 'Match declined'}, \
        status=status.HTTP_200_OK)