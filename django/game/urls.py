from django.urls import path, re_path

from . import views

urlpatterns = [
		path("save-score/", views.save_score, name="save-score"),
		path("create-match/", views.create_match, name="create_match"),
		path("broadcast-tournament/<str:p1>/<str:p2>/", views.broadcast_tournament, name="broadcast_tournament"),
	]
