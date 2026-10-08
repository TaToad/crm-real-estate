from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Deal
from .serializers import DealSerializer


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.select_related('company', 'manager').all()
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('title', 'company__name')
    filterset_fields = ('stage', 'currency', 'company', 'manager')

    @action(detail=True, methods=['patch'], url_path='stage')
    def change_stage(self, request, pk=None):
        """PATCH /api/v1/deals/{id}/stage/ — сменить этап сделки."""
        deal = self.get_object()
        stage = request.data.get('stage')

        valid_stages = [s[0] for s in Deal.STAGE_CHOICES]
        if stage not in valid_stages:
            return Response(
                {'detail': f'Недопустимый этап. Доступные: {valid_stages}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deal.stage = stage
        deal.save(update_fields=['stage', 'updated_at'])
        return Response(self.get_serializer(deal).data)