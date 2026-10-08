from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.select_related('manager').all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('name', 'inn', 'ogrn')
    filterset_fields = ('industry', 'region', 'client_type', 'manager')