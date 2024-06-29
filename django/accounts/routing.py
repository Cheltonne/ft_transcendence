from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    re_path('ws/accounts/', consumers.OnlineStatusConsumer.as_asgi()),
]