from rest_framework import serializers
from .models import CustomUser, Notification, Message

class CustomUserSerializer(serializers.ModelSerializer):
    friends = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'profile_picture', 'wins', 'losses', 'friends', 'online_devices_count', 'blocked_users']

    def get_friends(self, obj):
        friends = obj.friends.all()
        return CustomUserSerializer(friends, many=True, context=self.context).data

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return self.context['request'].build_absolute_uri(obj.profile_picture.url)
        return None

class NotificationSerializer(serializers.ModelSerializer):
    sender_id = serializers.PrimaryKeyRelatedField(source='sender', read_only=True)
    recipient_id = serializers.PrimaryKeyRelatedField(source='recipient', read_only=True)
    sender_username = serializers.SerializerMethodField()
    sender_pfp = serializers.SerializerMethodField()
    recipient_username = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'

    def get_sender_username(self, obj):
        return obj.sender.username

    def get_recipient_username(self, obj):
        return obj.recipient.username

    def get_context(self):
        context = super().get_context()
        context['request'] = self.context['request']
        return context

    def get_sender_pfp(self, obj):
        request = self.context.get('request')
        if obj.sender.profile_picture:
            return self.context['request'].build_absolute_uri(obj.sender.profile_picture.url)

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    sender_id = serializers.IntegerField(source='sender.id')
    recipient = serializers.StringRelatedField()
    sender_profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'recipient', 'content', 'timestamp', 'is_read', 'sender_profile_picture']

    def get_sender_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.sender.profile_picture:
            return request.build_absolute_uri(obj.sender.profile_picture.url)
        return None