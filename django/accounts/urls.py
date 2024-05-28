from django.urls import path
from . import views

urlpatterns = [
		path("logout/", views.user_logout, name="logout"),
        path("get-user-info/", views.get_user_info, name='get_user_info'),
        path("render-signin-form/", views.render_signin_form, name='render-signin-form'),
        path("render-signup-form/", views.render_signup_form, name='render-signup-form'),
        path("check-authenticated/", views.check_authenticated, name='check-authenticated'),
]
