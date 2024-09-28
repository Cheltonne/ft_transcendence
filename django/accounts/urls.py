from django.urls import path, include

from .Views import views
from .Views import Notifications
from . import form_views
from rest_framework.routers import DefaultRouter
from .Views.views import CustomUserViewSet, MessageViewSet
from .Views.Notifications import NotificationViewSet

router = DefaultRouter()
router.register(r'users', CustomUserViewSet) #remember NEVER to use empty routes or else
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
		path("logout/", views.user_logout, name="logout"),
        path("get-user-info/", views.get_user_info, name='get_user_info'),
        path("render-signin-form/", form_views.render_signin_form, name='render-signin-form'),
        path("render-signup-form/", form_views.render_signup_form, name='render-signup-form'),
        path("render-password-reset-form/", form_views.render_password_reset_form, name='render-password-reset-form'),
        path("render-update-form/", form_views.render_update_form, name='render-update-form'),
        path("check-authenticated/", views.check_authenticated, name='check-authenticated'),
        path('send-friend-request/', views.FriendRequestView.as_view(), name='send_friend_request'),
        path('notifications/<int:id>/mark_as_read/', Notifications.mark_as_read, name='mark_as_read'),
        path('', include(router.urls)),
]