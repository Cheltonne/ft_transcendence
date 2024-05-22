from django.contrib.auth import get_user_model

CustomUser = get_user_model()

class CustomAuthBackend:
    def authenticate(self, request, username=None, password=None):
        print('using custom auth logic')
        try:
            user = CustomUser.objects.get(username=username)
            if user.check_password(password):
                return user
        except CustomUser.DoesNotExist:
            pass
        return None
    
    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None