from django.urls import path

from . import views

urlpatterns = [
		path("save-score/", views.save_score, name="save-score"),
		path("create-match/", views.create_match, name="create_match"),
		path("create-online-match/", views.create_online_match, name="create_online_match"),
		]
