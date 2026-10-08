from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.deals.models import Deal
from apps.deals.serializers import DealSerializer

from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('contact', 'assigned_to').all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('title', 'company_name')
    filterset_fields = ('source', 'status', 'assigned_to')

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """POST /api/v1/leads/{id}/convert/ — конвертирует лид в сделку."""
        lead = self.get_object()

        if lead.status == 'converted':
            return Response(
                {'detail': 'Лид уже сконвертирован'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Определяем компанию
        company = None
        if lead.contact and lead.contact.company:
            company = lead.contact.company
        else:
            company_name = lead.company_name or lead.title
            company, _ = Company.objects.get_or_create(
                name=company_name,
                defaults={
                    'manager': lead.assigned_to,
                    'source': lead.source,
                },
            )

        # Создаём сделку
        amount = request.data.get('amount', 0)
        currency = request.data.get('currency', 'RUB')
        title = request.data.get('title') or f"Сделка по лиду: {lead.title}"

        deal = Deal.objects.create(
            title=title,
            lead=lead,
            company=company,
            amount=amount,
            currency=currency,
            stage='first_contact',
            probability=10,
            manager=lead.assigned_to,
        )

        # Обновляем статус лида
        lead.status = 'converted'
        lead.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'deal': DealSerializer(deal).data,
                'company_id': company.id,
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def public_lead_create(request):
    """POST /api/v1/public/leads/ — публичный приём заявок с сайта."""
    data = request.data
    title = (data.get('title') or '').strip()

    if not title:
        return Response(
            {'detail': 'Поле title обязательно'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lead = Lead.objects.create(
        title=title,
        source='website',
        status='new',
        company_name=(data.get('company_name') or '').strip(),
        notes=(data.get('notes') or '').strip(),
    )

    contact_name = (data.get('contact_name') or '').strip()
    if contact_name and lead.company_name:
        company, _ = Company.objects.get_or_create(
            name=lead.company_name,
            defaults={'source': 'website'},
        )
        contact = Contact.objects.create(
            company=company,
            full_name=contact_name,
            phone_mobile=(data.get('phone') or '').strip(),
            email=(data.get('email') or '').strip(),
        )
        lead.contact = contact
        lead.save(update_fields=['contact'])

    return Response(
        {'id': lead.id, 'status': 'created'},
        status=status.HTTP_201_CREATED,
    )