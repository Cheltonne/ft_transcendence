from django.urls import re_path
#from . import consumers
from accounts.consumers import OnlineStatusConsumer

websocket_urlpatterns = [
    re_path(r'ws/morpion/$', OnlineStatusConsumer.as_asgi()),
]