from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.deals.models import Deal
from apps.leads.models import Lead
from apps.tasks.models import Task


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()

        # === Основные метрики ===
        active_deals = Deal.objects.exclude(stage__in=['won', 'lost'])
        won_deals = Deal.objects.filter(stage='won')

        total_active_amount = active_deals.aggregate(s=Sum('amount'))['s'] or 0
        total_won_amount = won_deals.aggregate(s=Sum('amount'))['s'] or 0

        closed_total = Deal.objects.filter(stage__in=['won', 'lost']).count()
        won_count = won_deals.count()
        conversion = round(won_count / closed_total * 100, 1) if closed_total else 0

        tasks_open = Task.objects.filter(status='open').count()
        tasks_overdue = Task.objects.filter(
            status='open',
            deadline__lt=timezone.now(),
        ).count()

        companies_count = Company.objects.count()
        contacts_count = Contact.objects.count()
        leads_count = Lead.objects.filter(status__in=['new', 'in_progress']).count()

        # === Распределение сделок по этапам ===
        stages_data = []
        for stage_key, stage_label in Deal.STAGE_CHOICES:
            qs = Deal.objects.filter(stage=stage_key)
            stages_data.append({
                'stage': stage_key,
                'label': stage_label,
                'count': qs.count(),
                'amount': float(qs.aggregate(s=Sum('amount'))['s'] or 0),
            })

        # === Топ менеджеров по сумме сделок ===
        managers_data = list(
            Deal.objects
            .filter(stage='won', manager__isnull=False)
            .values('manager__username')
            .annotate(
                total=Sum('amount'),
                count=Count('id'),
            )
            .order_by('-total')[:10]
        )
        managers_chart = [
            {
                'name': m['manager__username'] or '—',
                'total': float(m['total'] or 0),
                'count': m['count'],
            }
            for m in managers_data
        ]

        # === Динамика по месяцам (последние 6 месяцев) ===
        six_months_ago = today - timedelta(days=180)
        monthly_data = []
        for i in range(6):
            month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_end = (month_start + timedelta(days=31)).replace(day=1)
            qs = Deal.objects.filter(
                stage='won',
                updated_at__gte=month_start,
                updated_at__lt=month_end,
            )
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'amount': float(qs.aggregate(s=Sum('amount'))['s'] or 0),
                'count': qs.count(),
            })
        monthly_data.reverse()

        return Response({
            'deals': {
                'active_count': active_deals.count(),
                'active_amount': float(total_active_amount),
                'won_count': won_count,
                'won_amount': float(total_won_amount),
                'conversion_percent': conversion,
            },
            'tasks': {
                'open': tasks_open,
                'overdue': tasks_overdue,
            },
            'companies_count': companies_count,
            'contacts_count': contacts_count,
            'active_leads_count': leads_count,
            'stages': stages_data,
            'managers': managers_chart,
            'monthly': monthly_data,
        })