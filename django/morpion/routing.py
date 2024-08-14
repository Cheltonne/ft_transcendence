from django.urls import path
from django.urls import re_path
#from . import consumers
from morpion.consumers import MatchmakingConsumer
from accounts.consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/morpion/', MatchmakingConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
]