from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Contact
from .serializers import ContactSerializer


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.select_related('company').all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('full_name', 'email', 'phone_mobile')
    filterset_fields = ('company', 'role_in_deal')