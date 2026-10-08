from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('user', 'deal').all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('title', 'description')
    filterset_fields = ('type', 'priority', 'status', 'user', 'deal')