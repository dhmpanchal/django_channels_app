from django.urls import path
from .views import index, send_background_mail, schedule_mail

urlpatterns = [
    path('', index, name='index'),
    path('announcement/', send_background_mail, name='announcement'),
    path('schedulemail/', schedule_mail, name='schedulemail'),
]
