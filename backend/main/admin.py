from django.contrib import admin
from .models import UserProfile, Product, Category, Order

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'is_featured')
    list_filter = ('category', 'is_featured')
    search_fields = ('name', 'description')

admin.site.register(UserProfile)
admin.site.register(Order)
