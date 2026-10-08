from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('contact', 'assigned_to').all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('title', 'company_name')
    filterset_fields = ('source', 'status', 'assigned_to')