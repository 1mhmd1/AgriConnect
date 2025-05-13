import json
import traceback
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth.models import User
from .models import ChatMessage, ChatContact
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        try:
            # Get the room name from the URL
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'chat_{self.room_name}'
            
            # Print connection details for debugging
            print(f"=======================================")
            print(f"WebSocket connect attempt on port 8001")
            print(f"Room name: {self.room_name}")
            print(f"Client: {self.scope['client']}")
            print(f"Headers: {self.scope.get('headers', [])}")
            print(f"User authenticated: {not self.scope['user'].is_anonymous}")
            
            if not self.scope['user'].is_anonymous:
                print(f"User ID: {self.scope['user'].id}, Username: {self.scope['user'].username}")
            else:
                print("User is anonymous - will use message user_id")
            
            # Join room group
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            
            # Add the channel to the group
            from asgiref.sync import async_to_sync
            async_to_sync(channel_layer.group_add)(
                self.room_group_name,
                self.channel_name
            )
            
            # Accept the connection
            print("Accepting WebSocket connection...")
            self.accept()
            print(f"WebSocket connected successfully: {self.room_name}")
            
            # Notify the client
            self.send(text_data=json.dumps({
                'message': f'Connected to chat room: {self.room_name}',
                'username': 'System',
                'type': 'connection_established'
            }))
            print("Connection confirmation sent to client")
            print(f"=======================================")
            
        except Exception as e:
            print(f"ERROR IN CONNECT: {e}")
            print(traceback.format_exc())
            # Try to accept the connection anyway to send error
            try:
                self.accept()
                self.send(text_data=json.dumps({
                    'error': str(e),
                    'message': 'Error establishing connection',
                    'type': 'error'
                }))
            except:
                pass
            raise

    def disconnect(self, close_code):
        # Leave room group
        from asgiref.sync import async_to_sync
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.room_name}, code: {close_code}")

    def receive(self, text_data):
        try:
            # Parse the received data
            data = json.loads(text_data)
            message = data.get('message', '')
            username = data.get('username', 'Anonymous')
            sender_id = data.get('sender_id')
            receiver_id = data.get('receiver_id')
            
            # Debug info
            print(f"Message received: {message} from {username}")
            print(f"Sender ID: {sender_id}, Receiver ID: {receiver_id}")
            
            if sender_id and receiver_id:
                # Save the message to the database
                self.save_message(sender_id, receiver_id, message)
                
                # Update the contact list
                self.update_contact(sender_id, receiver_id, message)
                
                # Send the message to the group
                from asgiref.sync import async_to_sync
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'username': username,
                        'sender_id': sender_id,
                        'receiver_id': receiver_id,
                        'timestamp': timezone.now().isoformat(),
                        'type': data.get('type', 'normal')  # Include message type
                    }
                )
            else:
                print(f"Error: Missing sender_id ({sender_id}) or receiver_id ({receiver_id})")
                self.send(text_data=json.dumps({
                    'error': 'Missing sender or receiver ID',
                    'message': 'Message could not be delivered',
                    'type': 'error'
                }))
        
        except Exception as e:
            print(f"Error in receive: {e}")
            self.send(text_data=json.dumps({
                'error': str(e),
                'message': 'Error processing message',
                'type': 'error'
            }))

    def chat_message(self, event):
        # Extract the data from the event
        message = event['message']
        username = event.get('username', 'Anonymous')
        sender_id = event.get('sender_id')
        receiver_id = event.get('receiver_id')
        timestamp = event.get('timestamp')
        message_type = event.get('type', 'normal')  # Get message type, default to 'normal'
        
        # Send the message to the WebSocket
        self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'timestamp': timestamp,
            'type': message_type  # Include the message type
        }))
    
    def save_message(self, sender_id, receiver_id, message):
        """Save a message to the database"""
        try:
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            
            ChatMessage.objects.create(
                sender=sender,
                receiver=receiver,
                message=message
            )
            print(f"Message saved to database: {sender_id} -> {receiver_id}: {message}")
        except Exception as e:
            print(f"Error saving message: {e}")
    
    def update_contact(self, user_id, contact_id, last_message):
        """Update or create a contact with the last message"""
        try:
            user = User.objects.get(id=user_id)
            contact = User.objects.get(id=contact_id)
            
            # Update or create contact for the sender
            ChatContact.objects.update_or_create(
                user=user,
                contact=contact,
                defaults={
                    'last_message': last_message,
                    'last_message_time': timezone.now()
                }
            )
            
            # Also update or create the reverse contact (for the receiver)
            ChatContact.objects.update_or_create(
                user=contact,
                contact=user,
                defaults={
                    'last_message': last_message,
                    'last_message_time': timezone.now()
                }
            )
            print(f"Contact updated: {user_id} <-> {contact_id}")
        except Exception as e:
            print(f"Error updating contact: {e}") 