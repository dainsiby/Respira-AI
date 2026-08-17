from django.urls import path
from .views import test_api, patient_list_create, patient_detail

urlpatterns = [
    path('test/', test_api, name='test-api'),
    path('patients/', patient_list_create, name='patient-list-create'),
    path('patients/<str:pk>/', patient_detail, name='patient-detail'),
]

