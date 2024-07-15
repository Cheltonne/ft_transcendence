from django.urls import path

from . import views

urlpatterns = [
		path('', views.render_game),	
		path("save-score/", views.save_score, name="save-score"),
		path("create-match/", views.create_match, name="create_match"),
		path("save-score-ai/", views.save_score_ai, name="save-score-ai"),
		path("create-match-ai/", views.create_match_ai, name="create_match_ai"),
		]
