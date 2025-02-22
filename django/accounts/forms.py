from django import forms
from .models import CustomUser
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError
import re

class CustomUserCreationForm(UserCreationForm):
	profile_picture = forms.ImageField(required=False)
	class Meta(UserCreationForm.Meta):
		model = CustomUser
		fields = [
			'username',
			'password1',
			'password2',
			'profile_picture'
			]
		help_texts = {
				'username': _("Maximum length: 15"),
				}
		
	def clean_username(self):
		username = self.cleaned_data.get('username')

		if not re.match(r'^\w+$', username):  # Matches alphanumeric and underscore
			raise ValidationError('Username can only contain letters, numbers and underscores😋')

		if username.strip() != username:
			raise ValidationError('Username cannot have leading or trailing spaces😼')

		return username

class CustomUserChangeForm(UserChangeForm):
	password = None
	profile_picture = forms.ImageField(widget=forms.FileInput(attrs={'class': 'form-control-file'}))
	username = forms.CharField(
		max_length=15,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control'})
		)
	class Meta:
		model = CustomUser
		fields = ("username", 'profile_picture')

	def clean_username(self):
		username = self.cleaned_data.get('username')

		if not re.match(r'^\w+$', username):  # Matches alphanumeric and underscore
			raise ValidationError('Username can only contain letters, numbers and underscores😋')

		if username.strip() != username:
			raise ValidationError('Username cannot have leading or trailing spaces😼')

		return username


class ChangePasswordForm(forms.Form):
    old_password = forms.CharField(widget=forms.PasswordInput())
    new_password = forms.CharField(widget=forms.PasswordInput())
    confirm_password = forms.CharField(widget=forms.PasswordInput())
def clean(self):
	cd = self.cleaned_data

	password1 = cd.get("new_password")
	password2 = cd.get("confirm_password")

	if password1 != password2:
		raise ValidationError("Passwords did not match")
	return cd

class CustomAuthenticationForm(AuthenticationForm):
	class Meta:
		model = CustomUser
		fields = ['username', 'password']
