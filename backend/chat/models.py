from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ChatContact(models.Model):
    """Represents a chat contact (someone the user has chatted with)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_user')
    contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_contact')
    last_message = models.TextField(blank=True, null=True)
    last_message_time = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'contact')
        ordering = ['-last_message_time']

    def __str__(self):
        return f"{self.user.username} - {self.contact.username}"

class ChatMessage(models.Model):
    """Stores chat messages between users"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username} at {self.timestamp}" 