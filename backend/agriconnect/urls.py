"""
URL configuration for agriconnect project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from main import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('profile/', views.profile_view, name='profile'),
    path('store/', views.store, name='store'),
    path('bot/', views.bot_view, name='bot'),
    path('chat/', views.chat_view, name='chat'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('wishlist/', views.wishlist_view, name='wishlist'),
    path('farmers/', views.farmers, name='farmers'),
    path('landowner/', views.landowner, name='landowner'),
    path('landowner/delete-land/<int:land_id>/', views.delete_land, name='delete_land'),
    path('landowner/update-land/<int:land_id>/', views.update_land, name='update_land'),
    path('landowner/add-land/', views.add_land_ajax, name='add_land_ajax'),
    path('edit-land/<int:land_id>/', views.edit_land, name='edit_land'),
    path('add-land/', views.add_land, name='add_land'),
    path('cart/', views.cart_data, name='cart_data'),
    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/', views.update_cart, name='update_cart'),
    path('cart/remove/', views.remove_from_cart, name='remove_from_cart'),
    path('api/', include('main.urls')),
    path('admin/orders/<int:order_id>/', views.admin_orders, name='admin_orders'),
    path('admin/categories/', views.create_category, name='create_category'),
    # Redirect ai/ to bot/ since they're the same feature
    path('ai/', lambda request: redirect('bot'), name='ai_redirect'),
    
    # Direct route to bot API
    path('api/bot/chat/', views.bot_chat_api, name='bot_chat_api'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
