from django.urls import path
from . import views

urlpatterns = [
		path("signup/", views.user_signup, name="signup"),
		path("login/", views.user_login, name="login"),
		path("logout/", views.user_logout, name="logout"),
		path("check-auth/", views.check_auth, name="check-auth"),
        path("get-user-info/", views.get_user_info, name='get_user_info'),
]
