from __future__  import unicode_literals, absolute_import
import os
from django.conf import settings
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_channles.settings')

app =  Celery('django_channles')
app.conf.enable_utc = False
app.conf.update(timezone = 'Asia/Kolkata')

app.config_from_object(settings, namespace='CELERY')

# celery beat settings
app.conf.beat_schedule = {
    # 'send-mail-every-day-at-8': {
    #     'task': 'app_Celery.task.send_mail_func',
    #     'schedule': crontab(hour=11, minute=51),
    #     # 'args': (2,)
    # }
}

app.autodiscover_tasks()

@app.task(bind=True)
def  debug_task(self):
    print('Request: {0!r}'.format(self.request))