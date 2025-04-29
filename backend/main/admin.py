from django.contrib import admin
from django import forms
from .models import UserProfile, Product, Category, Order

class CategoryAdminForm(forms.ModelForm):
    ICON_CHOICES = [
        # Pesticides and Plant Protection
        ('fa-bug', 'Insecticides'),
        ('fa-seedling', 'Herbicides'),
        ('fa-leaf', 'Fungicides'),
        ('fa-rat', 'Rodenticides'),
        ('fa-worm', 'Nematicides'),
        
        # Plant Nutrition
        ('fa-bottle-droplet', 'Fertilizers'),
        ('fa-arrow-trend-up', 'Plant Growth Regulators'),
        ('fa-mountain', 'Soil Conditioners'),
        
        # Additives and Enhancers
        ('fa-flask', 'Adjuvants'),
        ('fa-wind', 'Defoliants'),
        ('fa-sun', 'Desiccants'),
        ('fa-recycle', 'Biopesticides'),
        
        # Original categories
        ('fa-seedling', 'Seedling'),
        ('fa-tractor', 'Tractor'),
        ('fa-leaf', 'Leaf'),
        ('fa-apple-alt', 'Apple'),
        ('fa-carrot', 'Carrot'),
        ('fa-wheat-awn', 'Wheat'),
        ('fa-cow', 'Cow'),
        ('fa-egg', 'Egg'),
        ('fa-fish', 'Fish'),
        ('fa-bottle-water', 'Water'),
        ('fa-spray-can', 'Spray'),
        ('fa-box', 'Box'),
        ('fa-tools', 'Tools'),
        ('fa-warehouse', 'Warehouse'),
        ('fa-truck', 'Truck'),
        ('fa-shopping-basket', 'Basket'),
        ('fa-tag', 'Tag'),
        ('fa-tags', 'Tags'),
        ('fa-store', 'Store'),
        ('fa-shopping-cart', 'Cart')
    ]
    
    icon = forms.ChoiceField(choices=ICON_CHOICES, widget=forms.Select(attrs={'class': 'icon-select'}))
    
    class Meta:
        model = Category
        fields = '__all__'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    form = CategoryAdminForm
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock')
    list_filter = ('category',)
    search_fields = ('name', 'description')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'status')
    list_filter = ('status',)
    search_fields = ('id',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')
