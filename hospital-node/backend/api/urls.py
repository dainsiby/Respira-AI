from django.urls import path
from .views import (
    health_check,
    login_view,
    logout_view,
    me_view,
    user_list_create,
    user_toggle_active,
    patient_list_create,
    patient_detail,
    medical_history_list_create,
    appointment_list_create,
    appointment_detail,
    xray_request_list_create,
    xray_request_detail,
    imaging_study_list,
    imaging_study_detail,
    audit_log_list,
)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),
    
    path('users/', user_list_create, name='user-list-create'),
    path('users/<int:pk>/toggle-active/', user_toggle_active, name='user-toggle-active'),
    
    path('patients/', patient_list_create, name='patient-list-create'),
    path('patients/<str:pk>/', patient_detail, name='patient-detail'),
    path('patients/<str:patient_pk>/medical-history/', medical_history_list_create, name='medical-history-list-create'),
    
    path('appointments/', appointment_list_create, name='appointment-list-create'),
    path('appointments/<int:pk>/', appointment_detail, name='appointment-detail'),
    
    path('xray-requests/', xray_request_list_create, name='xray-request-list-create'),
    path('xray-requests/<int:pk>/', xray_request_detail, name='xray-request-detail'),
    
    path('imaging-studies/', imaging_study_list, name='imaging-study-list'),
    path('imaging-studies/<str:pk>/', imaging_study_detail, name='imaging-study-detail'),
    
    path('audit-logs/', audit_log_list, name='audit-log-list'),
]
