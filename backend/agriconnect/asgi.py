"""
ASGI config for agriconnect project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agriconnect.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
import chat.routing
from chat.middleware import WebSocketAuthMiddleware

# Initialize Django ASGI application
django_asgi_app = get_asgi_application()

# Define application with channel and WebSocket support
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        WebSocketAuthMiddleware(
            AuthMiddlewareStack(
                URLRouter(
                    chat.routing.websocket_urlpatterns
                )
            )
        )
    ),
})
