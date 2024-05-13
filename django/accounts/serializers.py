from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    token = serializers.CharField(read_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if user:
                data['token'] = 'your_generated_token(user)'  # Replace with token generation logic
                return data
            else:
                raise serializers.ValidationError('Invalid username or password')
        else:
            raise serializers.ValidationError('Both username and password are required')

class CustomUserSerializer(serializers.ModelSerializer):
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
