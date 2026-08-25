from django.urls import path
from .views import (
    test_api,
    register_view,
    login_view,
    logout_view,
    me_view,
    dashboard_metrics_view,
    patient_list_create,
    patient_detail,
    hospital_list_create,
    hospital_detail,
    user_list_create,
    user_toggle_active,
    imaging_list_create,
    imaging_detail,
    audit_log_list,
)

urlpatterns = [
    path('test/', test_api, name='test-api'),
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),
    
    path('dashboard/', dashboard_metrics_view, name='dashboard-metrics'),
    
    path('patients/', patient_list_create, name='patient-list-create'),
    path('patients/<str:pk>/', patient_detail, name='patient-detail'),
    
    path('hospitals/', hospital_list_create, name='hospital-list-create'),
    path('hospitals/<int:pk>/', hospital_detail, name='hospital-detail'),
    
    path('users/', user_list_create, name='user-list-create'),
    path('users/<int:pk>/toggle-active/', user_toggle_active, name='user-toggle-active'),
    
    path('imaging/', imaging_list_create, name='imaging-list-create'),
    path('imaging/<int:pk>/', imaging_detail, name='imaging-detail'),
    
    path('audit-logs/', audit_log_list, name='audit-log-list'),
]
