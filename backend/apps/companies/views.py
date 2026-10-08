import csv
import io

from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.select_related('manager').all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('name', 'inn', 'ogrn')
    filterset_fields = ('industry', 'region', 'client_type', 'manager')

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """GET /api/v1/companies/export/ — скачать всех клиентов в CSV."""
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="companies.csv"'

        # BOM для корректного открытия в Excel
        response.write('\ufeff')

        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Наименование', 'ИНН', 'КПП', 'ОГРН',
            'Отрасль', 'Регион', 'Тип клиента',
            'Юр. адрес', 'Факт. адрес', 'Источник', 'Заметки',
            'Создано', 'Обновлено',
        ])

        for c in Company.objects.all().order_by('id'):
            writer.writerow([
                c.id, c.name, c.inn, c.kpp, c.ogrn,
                c.industry, c.region, c.client_type,
                c.legal_address, c.actual_address, c.source, c.notes,
                c.created_at.strftime('%d.%m.%Y %H:%M'),
                c.updated_at.strftime('%d.%m.%Y %H:%M'),
            ])
        return response

    @action(
        detail=False,
        methods=['post'],
        url_path='import',
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_csv(self, request):
        """POST /api/v1/companies/import/ — загрузить CSV с клиентами.
        Ожидаемые колонки: name, inn, kpp, ogrn, industry, region,
        client_type, legal_address, actual_address, source, notes.
        Первая строка — заголовок.
        """
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'Файл не передан. Используйте поле "file".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file.name.lower().endswith('.csv'):
            return Response(
                {'detail': 'Поддерживаются только файлы .csv'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Пробуем UTF-8 (с BOM и без), иначе cp1251
            raw = file.read()
            try:
                text = raw.decode('utf-8-sig')
            except UnicodeDecodeError:
                text = raw.decode('cp1251')

            # Определяем разделитель: ; или ,
            first_line = text.split('\n', 1)[0]
            delimiter = ';' if first_line.count(';') >= first_line.count(',') else ','

            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)

            created = 0
            updated = 0
            errors = []

            for i, row in enumerate(reader, start=2):
                name = (row.get('name') or row.get('Наименование') or '').strip()
                if not name:
                    errors.append(f'Строка {i}: пропущена — нет name')
                    continue

                inn = (row.get('inn') or row.get('ИНН') or '').strip()
                defaults = {
                    'inn': inn,
                    'kpp': (row.get('kpp') or row.get('КПП') or '').strip(),
                    'ogrn': (row.get('ogrn') or row.get('ОГРН') or '').strip(),
                    'industry': (row.get('industry') or row.get('Отрасль') or '').strip(),
                    'region': (row.get('region') or row.get('Регион') or '').strip(),
                    'client_type': (row.get('client_type') or row.get('Тип клиента') or '').strip(),
                    'legal_address': (row.get('legal_address') or row.get('Юр. адрес') or '').strip(),
                    'actual_address': (row.get('actual_address') or row.get('Факт. адрес') or '').strip(),
                    'source': (row.get('source') or row.get('Источник') or '').strip(),
                    'notes': (row.get('notes') or row.get('Заметки') or '').strip(),
                }

                # Если есть ИНН — обновляем по ИНН, иначе создаём новую
                if inn:
                    obj, was_created = Company.objects.update_or_create(
                        inn=inn,
                        defaults={'name': name, **defaults},
                    )
                else:
                    obj = Company.objects.create(name=name, **defaults)
                    was_created = True

                if was_created:
                    created += 1
                else:
                    updated += 1

            return Response({
                'created': created,
                'updated': updated,
                'errors': errors,
                'total': created + updated,
            })

        except Exception as e:
            return Response(
                {'detail': f'Ошибка обработки файла: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(
        detail=False,
        methods=['get'],
        url_path='template',
    )
    def download_template(self, request):
        """GET /api/v1/companies/template/ — скачать пустой шаблон CSV."""
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="companies_template.csv"'
        response.write('\ufeff')

        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'name', 'inn', 'kpp', 'ogrn', 'industry', 'region',
            'client_type', 'legal_address', 'actual_address', 'source', 'notes',
        ])
        writer.writerow([
            'ООО Пример', '7701234567', '770101001', '1157746123456',
            'it', 'Москва', 'corporate',
            'г. Москва, ул. Ленина, д.1', 'г. Москва, ул. Ленина, д.1',
            'Сайт', 'Тестовая запись',
        ])
        return response