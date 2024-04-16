from django.urls import path

from . import views

urlpatterns = [
		path("save-score/", views.save_score, name="save-score"),
		path("login-signup/", views.render_login_signup, name="login-signup"),
		path("signup/", views.signup, name="signup"),
		path("login/", views.signup, name="login"),
		path("logout/", views.signup, name="logout"),
]
