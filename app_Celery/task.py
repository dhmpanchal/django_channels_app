from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django_channles import settings
from django.utils import timezone
from datetime import datetime, timedelta


@shared_task(bind=True)
def test_func(self):
    for i in range(10):
        print(i)
    
    return "Done"

@shared_task(bind=True)
def send_mail_func(self):
    users = get_user_model().objects.filter(is_superuser=False)
    print("users---", users)
    for user in users:
        print("user---", user)
        try:
            email_subject = "In App 1"
            email_body = "This is test email"
            to_email = user.email
            print("email_subject---", email_subject)
            print("email_body---", email_body)
            print("to_email---", to_email)
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[to_email],
                fail_silently=False
            )
        except Exception as e:
            print(e)
    return "Mail Sent Successfully"