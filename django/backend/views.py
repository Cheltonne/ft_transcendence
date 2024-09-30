import urllib.parse, random, string, requests, json, os
from django.shortcuts import render, redirect
from django.template.exceptions import TemplateDoesNotExist
from django.conf import settings
from django.core.files import File
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from accounts.models import CustomUser
from django.views.decorators.csrf import ensure_csrf_cookie

def index(request):
    return render(request, 'index.html')

def generate_random_state(length=42):
    """Generate a random string for the OAuth2 state parameter"""
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for i in range(length))

def get_oauth_url(request):
    client_id = 'u-s4t2ud-2cb98bf686a6a1bd8cae65a2f87314a831cf4fc50d2167d8dfa619008838ffa7'
    scope = 'public'
    state = generate_random_state()

    if 'localhost' in request.get_host():
        redirect_uri = 'https://localhost:4343/oauth/callback/'
    else:
        redirect_uri = 'https://' + request.get_host() + ':4343/oauth/callback/'

    auth_url = (
        f"https://api.intra.42.fr/oauth/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={urllib.parse.quote(redirect_uri)}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"state={state}"
    )
    
    request.session['oauth_state'] = state

    return JsonResponse({'auth_url': auth_url})

def oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No authorization code provided'}, status=400)

    client_id = os.environ.get('AUTH42_CLIENT_ID')
    client_secret = os.environ.get('AUTH42_CLIENT_SECRET')
    
    if 'localhost' in request.get_host():
        redirect_uri = 'https://localhost:4343/oauth/callback/'
    else:
        redirect_uri = 'https://' + request.get_host() + ':4343/oauth/callback/'

    token_url = 'https://api.intra.42.fr/oauth/token'
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret,
    }

    try:
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
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
        return JsonResponse({'error': f'Failed to retrieve user information: {e}'},
                            status=500)

    user_info = user_info_response.json()
    email = user_info.get('email')
    if not email:
        return JsonResponse({'error': 'No email found in user information'}, status=400)

    user_id = user_info.get('id', 'unknown')
    user_login = user_info.get('login', 'unknown')
    profile_picture = user_info.get('image', {}).get('link', '')
    email = user_info.get('email', 'unknown')

    suggested_username = user_login
    user = CustomUser.objects.filter(id=user_id).first()
    
    if user:
        login(request, user)
        return render(request, 'oauth_callback.html', {
            'status': 'success',
            'message': 'Authenticated successfully'
        })
    else:
        file_path = os.path.join(settings.MEDIA_ROOT, f'{user_id}.jpg')

        response = requests.get(profile_picture, stream=True)
        if response.status_code == 200:
            with open(file_path, 'wb') as out_file:
                out_file.write(response.content)
            profile_picture = str(user_id) + '.jpg'

        if CustomUser.objects.filter(username=suggested_username).exists():
            return render(request, 'oauth_callback.html', {
                'error': 'Username taken',
                'would_be_username': suggested_username,
                'oauth_id': user_id,
                'email': email,
                'profile_picture': profile_picture
            })

        user = CustomUser.objects.create(
            id=user_id,
            username=suggested_username,
            email=email,
            profile_picture=profile_picture
        )
        login(request, user)
        return render(request, 'oauth_callback.html', {
            'status': 'success',
            'message': 'Authenticated successfully'
        })

@login_required
def oauth_status(request):
    return JsonResponse({'is_authenticated': True})

@ensure_csrf_cookie
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
            id=oauth_id,
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

def email(request, subject, message, recipient): 
    try:
        email_from = settings.EMAIL_HOST_USER
        send_mail( subject, message, email_from, recipient )  
        return JsonResponse({"success": True})
    except:
        return JsonResponse({"success": False})