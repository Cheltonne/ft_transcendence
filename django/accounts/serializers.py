from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'profile_picture')

    def create(self, validated_data):
        """
        Create and return a new `CustomUser` instance, given the validated data.
        """
        return CustomUser.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update and return an existing `CustomUser` instance, given the validated data.
        """
        instance.username = validated_data.get('username', instance.name)
        instance.password = validated_data.get('password', instance.password)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.save()
        return instance

class CustomUserSerializer(serializers.ModelSerializer):
    friends = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'profile_picture', 'wins', 'losses', 'friends']

    def get_friends(self, obj):
        friends = obj.friends.all()
        return CustomUserSerializer(friends, many=True, context=self.context).data