from django.shortcuts import render
from django.template.exceptions import TemplateDoesNotExist
from django.http import JsonResponse
from django.template.loader import render_to_string

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
