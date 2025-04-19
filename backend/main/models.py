from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=[
        ('buyer', 'Buyer'),
        ('farmer', 'Farmer'),
        ('admin', 'Admin')
    ], default='buyer')
    username = models.CharField(max_length=150, unique=True, null=True)
    display_name = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    # Farmer specific fields
    farming_method = models.CharField(max_length=100, null=True, blank=True)
    experience_years = models.IntegerField(null=True, blank=True)
    crops = models.JSONField(null=True, blank=True)  # List of crops
    livestock = models.JSONField(null=True, blank=True)  # List of livestock
    equipment = models.JSONField(null=True, blank=True)  # List of equipment
    land_listings = models.JSONField(null=True, blank=True)  # List of land listings
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_display_name(self):
        return self.display_name or self.user.get_full_name() or self.username or self.user.username

class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50)  # Font Awesome icon class
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    image = models.ImageField(upload_to='products/')
    stock = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_featured = models.BooleanField(default=False)
    is_on_sale = models.BooleanField(default=False)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    
    buyer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.product.name}"

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.username}"

    @property
    def total_items(self):
        return self.items.count()

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in cart {self.cart.id}"

    @property
    def total_price(self):
        return self.quantity * self.product.price

class UserShippingInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Shipping Info"

class UserPaymentInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    card_name = models.CharField(max_length=255)
    card_number = models.CharField(max_length=16)  # Storing last 4 digits only
    expiry_date = models.CharField(max_length=5)  # MM/YY format
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Payment Info"

    def save(self, *args, **kwargs):
        # Only store last 4 digits of card number
        if len(self.card_number) > 4:
            self.card_number = self.card_number[-4:]
        super().save(*args, **kwargs)
