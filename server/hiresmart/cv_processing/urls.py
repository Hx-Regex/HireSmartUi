from django.urls import path, include
from . import views
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path('', views.index_view, name='index'),
    path('rank/', views.rank_cvs_view, name='rank'),
    path('chat/', views.chat_view, name='chat'),
    path('summarize/', views.summarize_view, name='summarize'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('auth/', include('auth_app.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)




