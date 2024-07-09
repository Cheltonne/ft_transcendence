from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

def send_friend_request_notification(sender, recipient):
    message = f'{sender.username} wants to add you as a friend.'
    notification = Notification.objects.create(sender=sender, recipient=recipient, message=message)
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{recipient.id}',
        {
            'type': 'send_notification',
            'notification': {
                'id': notification.id,
                'message': notification.message,
                'sender': sender.username,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
            }
        }
    )
