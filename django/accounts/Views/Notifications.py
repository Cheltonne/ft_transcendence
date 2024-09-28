from ..models import Notification, Message
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from ..serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): #this will only return unread notifications for performance
        user = self.request.user
        return Notification.objects.filter(recipient=user, \
        is_read=False).exclude(type__in=['match_request_accepted', 'match_request_declined']).order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = self.request.user
        unread_count = Notification.objects.filter(recipient=user, \
        is_read=False).exclude(\
            type__in=['match_request_accepted', 'match_request_declined']).order_by('-created_at').count()
        return Response({'unread_count': unread_count})

@api_view(['PUT'])
def mark_as_read(request, id):
    if request.method != 'PUT':
        return Response({'Error': 'Only PUT requests allowed'}, \
        status=status.HTTP_405_METHOD_NOT_ALLOWED)

    try:
        notification = Notification.objects.get(id=id)
        serializer = NotificationSerializer(notification, context={'request': request})
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification,\
         context={'request': request}).data)
    except Notification.DoesNotExist:
        return Response ({'Error': 'Error fetching notification. + ratio'})