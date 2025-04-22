from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Product, Order

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'phone_number', 'address', 'profile_picture', 'created_at']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create_user(**user_data)
        profile = UserProfile.objects.create(user=user, **validated_data)
        return profile

class ProductSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    sale_price = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'sale_price', 'is_on_sale', 
                 'stock', 'rating', 'image', 'category', 'created_at', 'updated_at']

    def get_category(self, obj):
        return {
            'id': obj.category.id,
            'name': obj.category.name
        } if obj.category else None

    def get_sale_price(self, obj):
        return str(obj.sale_price) if hasattr(obj, 'sale_price') else None

    def get_is_on_sale(self, obj):
        return hasattr(obj, 'sale_price') and obj.sale_price is not None

    def get_rating(self, obj):
        return obj.rating if hasattr(obj, 'rating') else 0

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'buyer', 'product', 'quantity', 'total_price', 'status', 'created_at', 'updated_at'] 