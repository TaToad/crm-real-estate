from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Deal
from .serializers import DealSerializer


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.select_related('company', 'manager').all()
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('title', 'company__name')
    filterset_fields = ('stage', 'currency', 'company', 'manager')