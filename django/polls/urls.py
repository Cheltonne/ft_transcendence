from django.urls import path

from . import views

urlpatterns = [
		path("", views.kauserie, name="index"),
		path("kaus", views.grosse_kauserie_view, name="GIGANTESQUE kauserie"),
]
