from django.shortcuts import render
from django.http import HttpResponse

def kauserie(request):
	return HttpResponse("Hello, World. Tsuioku hen.")

def grosse_kauserie_view(request):
    return render(request, 'grosse_kauserie.html')

def jam(request):
    return HtppResponse("Welcome to the new stage of sound and entertainment.")
