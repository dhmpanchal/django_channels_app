import json
from django.shortcuts import render
from django.http import HttpResponse
from .task import test_func, send_mail_func
from django_celery_beat.models import PeriodicTask, CrontabSchedule

# Create your views here.
def index(request):
    test_func.delay()
    return HttpResponse("Done")

def send_background_mail(request):
    send_mail_func.delay()
    return HttpResponse("Email Sent Successfully")

def schedule_mail(request):
    schedule, created = CrontabSchedule.objects.get_or_create(hour=15, minute=39, timezone='Asia/Kolkata')
    task = PeriodicTask.objects.create(crontab=schedule, name='Scheduled Mail 4', task='app_Celery.task.send_mail_func')  #, args=json.dumps([[2,3]]))
    return HttpResponse("Mail Scheduled Successfully")