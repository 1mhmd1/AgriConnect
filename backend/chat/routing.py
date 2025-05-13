from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Match patterns like 'private_22_27'
    re_path(r'ws/chat/(?P<room_name>[\w\d_\-]+)/$', consumers.ChatConsumer.as_asgi()),
] 