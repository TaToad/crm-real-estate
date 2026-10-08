from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.users.views import UserViewSet
from apps.companies.views import CompanyViewSet
from apps.contacts.views import ContactViewSet
from apps.leads.views import LeadViewSet
from apps.deals.views import DealViewSet
from apps.tasks.views import TaskViewSet
from apps.activities.views import ActivityViewSet


router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
]