# Video Chat App

This App developped using Django Channels.

## Steps to Configure Django Channels

1. First install django channel packege.

    ``` 
    python -m pip install -U channels["daphne"]
    ```

2. Once that’s done, you should add **daphne** to the beginning of your **INSTALLED_APPS** setting:

    ```
    INSTALLED_APPS = (
        "daphne",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.sites",
        ...
    )
    ```
3. Then, adjust your project’s asgi.py file, e.g. myproject/asgi.py, to wrap the Django ASGI application:

    ```
    import os

    from channels.routing import ProtocolTypeRouter
    from django.core.asgi import get_asgi_application

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    # Initialize Django ASGI application early to ensure the AppRegistry
    # is populated before importing code that may import ORM models.
    django_asgi_app = get_asgi_application()

    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        # Just HTTP for now. (We can add other protocols later.)
    })
    ```

4. And finally, set your ASGI_APPLICATION setting to point to that routing object as your root application:

    ```
    ASGI_APPLICATION = "myproject.asgi.application"
    ```

For further information refer [Django Channels](https://channels.readthedocs.io/en/stable/) document.
