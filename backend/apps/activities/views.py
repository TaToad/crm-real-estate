from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Activity
from .serializers import ActivitySerializer


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related('user').all()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('action', 'object_type', 'object_id', 'user')

    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """GET /api/v1/activities/timeline/?object_type=Company&object_id=1
        Возвращает ленту событий по компании + её сделкам + контактам.
        """
        object_type = request.query_params.get('object_type')
        object_id = request.query_params.get('object_id')

        if not object_type or not object_id:
            return Response(
                {'detail': 'Параметры object_type и object_id обязательны'},
                status=400,
            )

        q = Q(object_type=object_type, object_id=object_id)

        if object_type == 'Company':
            from apps.deals.models import Deal
            from apps.contacts.models import Contact

            deal_ids = list(
                Deal.objects.filter(company_id=object_id).values_list('id', flat=True)
            )
            contact_ids = list(
                Contact.objects.filter(company_id=object_id).values_list('id', flat=True)
            )
            if deal_ids:
                q |= Q(object_type='Deal', object_id__in=deal_ids)
            if contact_ids:
                q |= Q(object_type='Contact', object_id__in=contact_ids)

        qs = Activity.objects.filter(q).select_related('user').order_by('-timestamp')[:200]
        return Response({'results': ActivitySerializer(qs, many=True).data})