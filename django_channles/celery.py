from __future__  import unicode_literals, absolute_import
import os
from django.conf import settings
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_channles.settings')

app =  Celery('django_channles')
app.conf.enable_utc = False
app.conf.update(timezone = 'Asia/Kolkata')

app.config_from_object(settings, namespace='CELERY')

# celery beat settings
app.conf.beat_schedule = {
    
}

app.autodiscover_tasks()

@app.task(bind=True)
def  debug_task(self):
    print('Request: {0!r}'.format(self.request))