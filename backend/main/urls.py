from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profiles', views.UserProfileViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'orders', views.OrderViewSet)

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('profile/', views.profile_view, name='profile'),
    path('store/', views.store, name='store'),
    path('bot/', views.bot_view, name='bot'),
    path('landowner/', views.landowner, name='landowner'),
    path('landowner/delete-land/<int:land_id>/', views.delete_land, name='delete_land'),
    path('landowner/update-land/<int:land_id>/', views.update_land, name='update_land'),
    path('landowner/add-land/', views.add_land_ajax, name='add_land_ajax'),
    path('chat/', views.chat_view, name='chat'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('wishlist/', views.wishlist_view, name='wishlist'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    
    # Admin URLs
    path('admin/', views.admin_view, name='admin'),
    path('admin/products/', views.admin_products, name='admin_products'),
    path('admin/products/<int:product_id>/', views.admin_products, name='admin_product_detail'),
    path('admin/orders/<int:order_id>/', views.admin_orders, name='admin_order_detail'),
    
    # API URLs
    path('api/', include(router.urls)),
    path('categories/<int:category_id>/products/', views.category_products, name='category_products'),
    path('api/categories/<int:category_id>/products/', views.category_products_api, name='category_products_api'),
    path('cart/', views.cart_view, name='cart'),
    path('api/cart/', views.cart_data, name='cart_data'),
    path('api/cart/update/', views.update_cart, name='update_cart'),
    path('api/cart/remove/', views.remove_from_cart, name='remove_from_cart'),
    path('products/<int:product_id>/', views.product_detail, name='get_product_details'),
    path('api/products/<int:pk>/', views.product_detail, name='product_detail'),
    path('api/categories/<int:pk>/products/', views.category_products, name='category_products'),
    path('api/cart/add/', views.add_to_cart, name='add_to_cart'),
    path('api/wishlist/toggle/<int:product_id>/', views.toggle_wishlist, name='toggle_wishlist'),
    path('api/wishlist/status/<int:product_id>/', views.get_wishlist_status, name='get_wishlist_status'),
    path('api/categories/', views.get_categories, name='get_categories'),
    
    # Bot API - Fixed to work with the URL config in agriconnect/urls.py
    path('bot/chat/', views.bot_chat_api, name='bot_chat_api'),
]