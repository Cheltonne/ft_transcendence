from django.shortcuts import render, redirect
from django.template.exceptions import TemplateDoesNotExist
from django.conf import settings
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
import urllib.parse
import random
import string
import requests
from accounts.models import CustomUser

def index(request):
    return render(request, 'index.html')

def render_template(request, folder, template_name):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method.'})
    try:
        user = request.user
        context = {'userInfo': user}
        url = folder + '/' + template_name + '.html'
        html_content = render_to_string(url, context)
        return JsonResponse({'success': True, 'html': html_content})

    except TemplateDoesNotExist as e:
        url = folder + '/' + template_name
        error_message = f"Template '{url}.html' does not exist."
        return JsonResponse({'success': False, 'error': error_message})

    except Exception as e:
        error_message = f"An error occurred while rendering the template: {str(e)}"
        return JsonResponse({'success': False, 'error': error_message})

def generate_random_state(length=40):
    """Generate a random string for the OAuth2 state parameter"""
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for i in range(length))

def get_oauth_url(request):
    client_id = 'u-s4t2ud-2cb98bf686a6a1bd8cae65a2f87314a831cf4fc50d2167d8dfa619008838ffa7'
    redirect_uri = settings.OAUTH_REDIRECT_URI
    scope = 'public'  # Ensure this scope matches your needs
    state = generate_random_state()  # Generate a secure, random state parameter
    
    auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-2cb98bf686a6a1bd8cae65a2f87314a831cf4fc50d2167d8dfa619008838ffa7&redirect_uri=https%3A%2F%2Flocalhost%3A4343%2Foauth%2Fcallback%2F&response_type=code&scope={scope}&state={state}"
    
    # Save the state in the session for later validation
    request.session['oauth_state'] = state

    return JsonResponse({'auth_url': auth_url})

def oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No authorization code provided'}, status=400)

    client_id = 'u-s4t2ud-2cb98bf686a6a1bd8cae65a2f87314a831cf4fc50d2167d8dfa619008838ffa7'
    client_secret = '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'
    redirect_uri = 'https://localhost:4343/oauth/callback/'

    # Step 3: Exchange authorization code for access token
    token_url = 'https://api.intra.42.fr/oauth/token'
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret,
    }

    # Use requests to post the data to the token endpoint
    try:
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()  # Raises an HTTPError if the response code was unsuccessful
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'Failed to retrieve access token: {e}'}, status=500)

    token_json = token_response.json()
    access_token = token_json.get('access_token')

    if not access_token:
        return JsonResponse({'error': 'Access token was not provided in the response'}, status=500)

    user_info_url = 'https://api.intra.42.fr/v2/me'
    try:
        user_info_response = requests.get(user_info_url, headers={'Authorization': f'Bearer {access_token}'})
        user_info_response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'Failed to retrieve user information: {e}'}, status=500)

    user_info = user_info_response.json()
    email = user_info.get('email')
    if not email:
        return JsonResponse({'error': 'No email found in user information'}, status=400)

    # Correctly access the dictionary keys
    user_id = user_info.get('id', 'unknown')
    user_kind = user_info.get('kind', 'unknown')
    user_login = user_info.get('login', 'unknown')
    profile_picture = user_info.get('image', {}).get('link', '')
    email = user_info.get('email', 'unknown')

    suggested_username = f"{user_login}-cacs"
    if CustomUser.objects.filter(username=suggested_username).exists():
        return redirect(f'/choose-username/?oauth_id={user_id}&email={email}&profile_picture={profile_picture}')

    user, created = CustomUser.objects.get_or_create(
        id=user_id,
        defaults={
            'username': suggested_username,
            'email': email,
            'profile_picture': profile_picture
        }
    ) 
    login(request, user)
    #return JsonResponse(user_info) #Easily check the user object as return bby 42Auth

    return render(request, 'oauth_callback.html', {
        'status': 'success',
        'message': 'Authenticated successfully'
    })

@login_required
def oauth_status(request):
    return JsonResponse({'is_authenticated': True})

def choose_username(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        new_username = data.get('username')
        oauth_id = data.get('oauth_id')
        email = data.get('email')
        profile_picture = data.get('profile_picture')

        if CustomUser.objects.filter(username=new_username).exists():
            return JsonResponse({'status': 'error', 'error': 'Username already taken'})

        user, created = CustomUser.objects.get_or_create(
            oauth_id=oauth_id,
            defaults={
                'username': new_username,
                'email': email,
                'profile_picture': profile_picture
            }
        )

        if created:
            login(request, user)
            return JsonResponse({'status': 'success', 'message': 'User created and logged in'})
        else:
            return JsonResponse({'status': 'error', 'error': 'User already exists'})

    return JsonResponse({'status': 'error', 'error': 'Invalid request method'}, status=405)