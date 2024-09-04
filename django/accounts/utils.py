from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from PIL import Image

def resize_image(image_file, max_width):
    image = Image.open(image_file)
    original_width, original_height = image.size
    aspect_ratio = original_width / original_height
    new_height = int(max_width / aspect_ratio)
    resized_image = image.resize((max_width, new_height), Image.LANCZOS)

    return resized_image

def send_friend_request_notification(sender, recipient):
    message = f'{sender.username} wants to add you as a friend.'
    notification = Notification.objects.create(type='friend_request', sender=sender, recipient=recipient, message=message)
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{recipient.id}',
        {
            'type': 'send_notification',
            'notification': {
                'id': notification.id,
                'message': notification.message,
                'sender': sender.username,
                'sender_id': sender.id,
                'sender_pfp': sender.profile_picture.url,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
                'type': 'friend_request',
            }
        }
    )

def send_notification(sender, recipient, type, message):
    if type != 'tournament_notice':
        notification = Notification.objects.create(
            type=type, 
            sender=sender, 
            recipient=recipient, 
            message=message)
    else:
        notification = Notification.objects.create(
            type=type, 
            sender=sender, 
            recipient=recipient, 
            message=message,
            is_read=True)
    sender_data = {
        'id': sender.id,
        'username': sender.username,
    }
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{recipient.id}',
        {
            'type': 'send_notification',
            'notification': {
                'id': notification.id,
                'message': notification.message,
                'sender': sender_data,
                'sender_pfp': sender.profile_picture.url,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
                'type': notification.type,
            }
        }
    )

def request_already_sent(sender, recipient):
    try:
        notification = Notification.objects.get(
            recipient_id=recipient.id, 
            sender_id=sender.id, 
            type='friend_request', 
            is_read=False)
    except Notification.DoesNotExist:
        return False
    return True

def is_already_friends_with_recipient(sender, recipient):
    return recipient in sender.friends.all()