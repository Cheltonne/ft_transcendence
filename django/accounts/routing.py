from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    re_path('ws/accounts/', consumers.tagrossemere.as_asgi()),
]