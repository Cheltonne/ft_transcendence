from django.urls import path

from . import views

urlpatterns = [
		path('', views.render_game),	
		path("save-score/", views.save_score, name="save-score"),
		path("create-match/", views.create_match, name="create_match"),
		]
