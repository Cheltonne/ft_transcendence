from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from morpion.routing import websocket_urlpatterns as morpion_websocket_urlpatterns
from accounts.routing import websocket_urlpatterns as accounts_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            morpion_websocket_urlpatterns +
            accounts_websocket_urlpatterns
        )
    ),
})