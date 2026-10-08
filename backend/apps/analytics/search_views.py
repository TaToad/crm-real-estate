from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.deals.models import Deal
from apps.leads.models import Lead


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get('q') or '').strip()
        if not query or len(query) < 2:
            return Response({'results': [], 'query': query})

        limit = 5
        results = []

        # Компании
        companies = Company.objects.filter(
            Q(name__icontains=query) |
            Q(inn__icontains=query) |
            Q(ogrn__icontains=query)
        )[:limit]
        for c in companies:
            results.append({
                'type': 'company',
                'id': c.id,
                'title': c.name,
                'subtitle': c.inn or c.region or '',
                'url': f'/companies/{c.id}',
            })

        # Сделки
        deals = Deal.objects.filter(
            Q(title__icontains=query) |
            Q(company__name__icontains=query)
        ).select_related('company')[:limit]
        for d in deals:
            results.append({
                'type': 'deal',
                'id': d.id,
                'title': d.title,
                'subtitle': d.company.name if d.company else '',
                'url': f'/deals?highlight={d.id}',
            })

        # Контакты
        contacts = Contact.objects.filter(
            Q(full_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone_mobile__icontains=query)
        ).select_related('company')[:limit]
        for c in contacts:
            results.append({
                'type': 'contact',
                'id': c.id,
                'title': c.full_name,
                'subtitle': f"{c.position} · {c.company.name}" if c.company else c.position,
                'url': f'/companies/{c.company_id}' if c.company_id else '/companies',
            })

        # Лиды
        leads = Lead.objects.filter(
            Q(title__icontains=query) |
            Q(company_name__icontains=query)
        )[:limit]
        for l in leads:
            results.append({
                'type': 'lead',
                'id': l.id,
                'title': l.title,
                'subtitle': l.company_name,
                'url': '/leads',
            })

        return Response({'results': results, 'query': query})