from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)

urlpatterns = [
        path('', include(router.urls)),
		path("logout/", views.user_logout, name="logout"),
        path("get-user-info/", views.get_user_info, name='get_user_info'),
        path("render-signin-form/", views.render_signin_form, name='render-signin-form'),
        path("render-signup-form/", views.render_signup_form, name='render-signup-form'),
        path("render-update-form/", views.render_update_form, name='render-update-form'),
        path("check-authenticated/", views.check_authenticated, name='check-authenticated'),
]
