"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from game.views import save_score
from django.views.generic.base import TemplateView

urlpatterns = [
    path('', views.index),
    path('admin/', admin.site.urls),
    path("game/", include("game.urls")),
    path("accounts/", include("accounts.urls")),
    path("morpion/", include("morpion.urls")),
	path("accounts/", include("django.contrib.auth.urls")),
    path("render-template/<str:folder>/<str:template_name>/", views.render_template, name='render-template'),
    re_path(r'^(?!api/)(?!admin/)(?!static/)(?!.*\.(jpg|jpeg|png|gif|svg)$).*$', TemplateView.as_view(template_name='index.html'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
