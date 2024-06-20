from django import forms
from .models import CustomUser
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.forms import AuthenticationForm

class CustomUserCreationForm(UserCreationForm):
	profile_picture = forms.ImageField(required=False)
	class Meta(UserCreationForm.Meta):
		model = CustomUser
		fields = ['username', 'password1', 'password2', 'profile_picture']
		help_texts = {
				'username': _("Taille maximale: 15"),
				}

class CustomUserChangeForm(UserChangeForm):
	class Meta:
		model = CustomUser
		fields = ("username", 'profile_picture')
	profile_picture = forms.ImageField(required=False)
class CustomAuthenticationForm(AuthenticationForm):
	class Meta:
		model = CustomUser
		fields = ['username', 'password']
