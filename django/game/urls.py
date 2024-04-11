from django.urls import path

from . import views

urlpatterns = [
		path("", views.save_score, name="save-score"),
]
