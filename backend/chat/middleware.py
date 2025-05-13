from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from django.db import close_old_connections
import logging

logger = logging.getLogger(__name__)

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Close old database connections
        close_old_connections()
        
        # Get the user from the scope
        user = await self.get_user(scope)
        
        # Store the user in the scope
        scope['user'] = user
        
        # Log the authentication status
        if user.is_anonymous:
            logger.info("WebSocket User Anonymous - using message user_id")
        else:
            logger.info(f"WebSocket User Authenticated: {user.username} (ID: {user.id})")
        
        # Process the next middleware
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user(self, scope):
        # Get the session key from the scope
        try:
            session_key = scope['cookies'].get('sessionid', None)
            
            if not session_key:
                logger.warning("No session key found in WebSocket scope")
                return AnonymousUser()
            
            # Get the user from the session
            from django.contrib.sessions.models import Session
            from django.utils import timezone
            
            session = Session.objects.get(session_key=session_key)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id', None)
            
            if not user_id:
                logger.warning("No user_id found in session")
                return AnonymousUser()
            
            # Get the user
            user = User.objects.get(id=user_id)
            logger.info(f"User authenticated from session: {user.username} (ID: {user.id})")
            return user
        except Exception as e:
            logger.error(f"Error authenticating WebSocket user: {e}")
            return AnonymousUser() 