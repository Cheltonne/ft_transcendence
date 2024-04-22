from django.urls import path

from . import views

urlpatterns = [
		path("save-score/", views.save_score, name="save-score"),
]
