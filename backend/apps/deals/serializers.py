from rest_framework import serializers
from .models import Deal


class DealSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    manager_name = serializers.CharField(source='manager.username', read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')