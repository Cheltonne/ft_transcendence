from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
    path("ws/chat/", consumers.ChatConsumer.as_asgi()),
    re_path('ws/accounts/', consumers.OnlineStatusConsumer.as_asgi()),
]