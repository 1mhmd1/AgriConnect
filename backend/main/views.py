from django.shortcuts import render, redirect
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Product, Order
from .serializers import UserSerializer, UserProfileSerializer, ProductSerializer, OrderSerializer

# Create your views here.

def index(request):
    return render(request, 'index.html')

@login_required
def profile_view(request):
    # Get the user's profile or create one if it doesn't exist
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Check if this is a profile picture upload
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
            profile.save()
            return redirect('profile')

        # Check if this is a security form submission
        if request.POST.get('form_type') == 'security':
            current_password = request.POST.get('current_password')
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')
            
            # Verify current password
            if not request.user.check_password(current_password):
                return render(request, 'profile.html', {
                    'profile': profile,
                    'user': request.user,
                    'error': 'Current password is incorrect'
                })
                
            # Verify new passwords match
            if new_password != confirm_password:
                return render(request, 'profile.html', {
                    'profile': profile,
                    'user': request.user,
                    'error': 'New passwords do not match'
                })
                
            # Update password
            request.user.set_password(new_password)
            request.user.save()
            # Re-authenticate user to prevent logout
            user = authenticate(username=request.user.username, password=new_password)
            if user:
                login(request, user)
            return redirect('profile')

        # Handle profile type updates (farmer, base, etc)
        profile_type = request.POST.get('profile_type')
        
        if profile_type == 'farmer':
            # Update farmer specific fields
            profile.role = 'farmer'
            profile.farming_method = request.POST.get('farming_method', profile.farming_method)
            profile.experience_years = request.POST.get('experience_years', profile.experience_years)
            
            # Handle array fields
            if request.POST.get('crops'):
                profile.crops = request.POST.get('crops').split(',')
            if request.POST.get('livestock'):
                profile.livestock = request.POST.get('livestock').split(',')
            if request.POST.get('equipment'):
                profile.equipment = request.POST.get('equipment').split(',')
                
        else:
            # Handle base profile updates
            # Handle full name
            full_name = request.POST.get('fullName', '').strip()
            if full_name:
                name_parts = full_name.split(' ', 1)
                request.user.first_name = name_parts[0]
                request.user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                request.user.save()
                
            # Update user email
            email = request.POST.get('email')
            if email and email != request.user.email:
                request.user.email = email
                request.user.username = email  # Since we're using email as username
                request.user.save()
            
            # Update profile fields
            profile.phone = request.POST.get('phone', profile.phone)
            profile.location = request.POST.get('location', profile.location)
            
        profile.save()
        return redirect('profile')
        
    context = {
        'profile': profile,
        'user': request.user
    }
    return render(request, 'profile.html', context)

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('profile')
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('index')

def signup_view(request):
    if request.method == 'POST':
        # Get form data
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Validate passwords match
        if password != confirm_password:
            return render(request, 'signup.html', {'error': 'Passwords do not match'})

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already registered'})

        # Create user with full name and email
        user = User.objects.create_user(
            username=email,  # Using email as username
            email=email,
            password=password
        )
        
        # Set the full name
        name_parts = name.split(' ', 1)
        user.first_name = name_parts[0]
        if len(name_parts) > 1:
            user.last_name = name_parts[1]
        user.save()

        # Create user profile with initial data
        UserProfile.objects.create(
            user=user,
            role='buyer'  # Default role
        )

        # Log the user in
        login(request, user)
        return redirect('profile')

    return render(request, 'signup.html')

def store_view(request):
    return render(request, 'store.html')

def bot_view(request):
    return render(request, 'bot.html')

def checkout_view(request):
    return render(request, 'checkout.html')

def wishlist_view(request):
    return render(request, 'wishlist.html')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        role = self.request.query_params.get('role', None)
        if role == 'farmer':
            queryset = queryset.filter(farmer__user=self.request.user)
        return queryset

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.all()
        role = self.request.query_params.get('role', None)
        if role == 'buyer':
            queryset = queryset.filter(buyer__user=self.request.user)
        elif role == 'farmer':
            queryset = queryset.filter(product__farmer__user=self.request.user)
        return queryset
