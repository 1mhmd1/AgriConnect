"""
Script to clear connection test messages from the database
Run this script from the command line: python chat/cleanup_conn_messages.py
"""

import os
import django
import sys

# Set up Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agriconnect.settings')
django.setup()

from chat.models import ChatMessage

def cleanup_connection_messages():
    """Delete all connection test messages from the database"""
    test_msgs = ChatMessage.objects.filter(message__contains='Connection established')
    count = test_msgs.count()
    test_msgs.delete()
    print(f"Deleted {count} connection messages from the database")

if __name__ == "__main__":
    # Only run if this script is executed directly
    cleanup_connection_messages() 