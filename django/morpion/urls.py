from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'matches', views.MatchViewSet) #remember NEVER to use empty routes or else
urlpatterns = [
		path('', views.render_game),	
		path("save-score/", views.save_score, name="save-score"),
		path("create-match/", views.create_match, name="create_match"),
		path('create-matchmacking-game/', views.create_matchmacking_match, name='create_matchmacking_game'),
		path("save-score-ai/", views.save_score_ai, name="save-score-ai"),
		path("create-match-ai/", views.create_match_ai, name="create_match_ai"),
		path('', include(router.urls)),  # Ensure the router is included here! I'm DEADASS
		]
