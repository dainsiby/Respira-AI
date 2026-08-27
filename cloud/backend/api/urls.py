from django.urls import path
from .views import (
    health_check,
    login_view,
    logout_view,
    me_view,
    hospital_registration_view,
    hospital_application_list,
    hospital_application_detail,
    hospital_application_approve,
    hospital_application_reject,
    hospital_portal_profile,
    hospital_portal_application,
    hospital_portal_nodes,
    hospital_portal_installer,
    cloud_dashboard,
    hospital_list_create,
    hospital_detail,
    node_list_create,
    node_detail,
    node_register_view,
    node_heartbeat_view,
    audit_log_list,
)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),
    
    path('hospital-registration/', hospital_registration_view, name='hospital-registration'),
    
    path('hospital-applications/', hospital_application_list, name='hospital-application-list'),
    path('hospital-applications/<int:pk>/', hospital_application_detail, name='hospital-application-detail'),
    path('hospital-applications/<int:pk>/approve/', hospital_application_approve, name='hospital-application-approve'),
    path('hospital-applications/<int:pk>/reject/', hospital_application_reject, name='hospital-application-reject'),
    
    path('hospital-portal/profile/', hospital_portal_profile, name='hospital-portal-profile'),
    path('hospital-portal/application/', hospital_portal_application, name='hospital-portal-application'),
    path('hospital-portal/nodes/', hospital_portal_nodes, name='hospital-portal-nodes'),
    path('hospital-portal/installer/', hospital_portal_installer, name='hospital-portal-installer'),
    
    path('dashboard/', cloud_dashboard, name='cloud-dashboard'),
    
    path('hospitals/', hospital_list_create, name='hospital-list-create'),
    path('hospitals/<str:pk>/', hospital_detail, name='hospital-detail'),
    
    path('nodes/', node_list_create, name='node-list-create'),
    path('nodes/register/', node_register_view, name='node-register'),
    path('nodes/heartbeat/', node_heartbeat_view, name='node-heartbeat'),
    path('nodes/<str:pk>/', node_detail, name='node-detail'),
    
    path('audit-logs/', audit_log_list, name='audit-log-list'),
]
