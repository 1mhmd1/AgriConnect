from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Product, Order, Category, Cart, CartItem, UserShippingInfo, UserPaymentInfo
from .serializers import UserSerializer, UserProfileSerializer, ProductSerializer, OrderSerializer
from django.utils import timezone
import os
from django.http import JsonResponse, HttpResponse
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import F
from django.db import transaction

# Create your views here.

def index(request):
    return render(request, 'index.html')

@login_required
def profile_view(request):
    # Get the user's profile or create one if it doesn't exist
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Determine which profile types are accessible based on user role
    accessible_profiles = ['base']  # Base profile is always accessible
    
    if profile.role == 'farmer':
        accessible_profiles.append('farmer')
    elif profile.role == 'landowner':
        accessible_profiles.append('landowner')
    
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
                    'error': 'Current password is incorrect',
                    'accessible_profiles': accessible_profiles
                })
                
            # Verify new passwords match
            if new_password != confirm_password:
                return render(request, 'profile.html', {
                    'profile': profile,
                    'user': request.user,
                    'error': 'New passwords do not match',
                    'accessible_profiles': accessible_profiles
                })
                
            # Update password
            request.user.set_password(new_password)
            request.user.save()
            # Re-authenticate user to prevent logout
            user = authenticate(username=request.user.username, password=new_password)
            if user:
                login(request, user)
            return redirect('profile')

        # Handle base profile form submission
        if request.POST.get('form_type') == 'base_profile':
            try:
                # Update phone and location
                phone = request.POST.get('phone')
                location = request.POST.get('location')
                
                if phone:
                    profile.phone = phone
                if location:
                    profile.location = location
                
                # Save profile changes
                profile.save()
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Profile updated successfully',
                    'phone': profile.phone,
                    'location': profile.location
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)

        # Handle land listing submission (only for landowners)
        if request.POST.get('form_type') == 'land_listing' and 'landowner' in accessible_profiles:
            # Get existing land listings or initialize empty list
            land_listings = profile.land_listings if profile.land_listings else []
            
            # Create new land listing object
            new_listing = {
                'images': [],  # This will be handled separately for file uploads
                'size': request.POST.get('landSize'),
                'soil_type': request.POST.get('soilType'),
                'water_source': request.POST.get('waterSource'),
                'lease_terms': request.POST.getlist('lease_terms[]'),
                'price_per_acre': request.POST.get('pricePerAcre'),
                'created_at': timezone.now().isoformat()
            }
            
            # Handle land images if uploaded
            if 'landImages' in request.FILES:
                for image in request.FILES.getlist('landImages'):
                    # Save the image and get its path
                    image_path = f'land_images/{request.user.id}_{timezone.now().timestamp()}_{image.name}'
                    with open(f'media/{image_path}', 'wb+') as destination:
                        for chunk in image.chunks():
                            destination.write(chunk)
                    new_listing['images'].append(image_path)
            
            # Add new listing to the list
            land_listings.append(new_listing)
            
            # Update profile with new land listings
            profile.land_listings = land_listings
            profile.save()
            return redirect('profile')

        # Handle profile type updates (farmer, base, etc)
        profile_type = request.POST.get('profile_type')
        
        if profile_type == 'farmer' and 'farmer' in accessible_profiles:
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
            
            # Update phone and location
            phone = request.POST.get('phone')
            location = request.POST.get('location')
            
            if phone:
                profile.phone = phone
            if location:
                profile.location = location
            
            # Save profile changes
            profile.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Profile updated successfully',
                'phone': profile.phone,
                'location': profile.location
            })
        
    context = {
        'profile': profile,
        'user': request.user,
        'accessible_profiles': accessible_profiles
    }
    return render(request, 'profile.html', context)

def login_view(request):
    if request.method == 'POST':
        login_field = request.POST.get('email')  # This field now contains either email or username
        password = request.POST.get('password')
        
        # First try to authenticate with the provided field as username
        user = authenticate(request, username=login_field, password=password)
        
        # If that fails, try to find user by email
        if user is None:
            try:
                user_obj = User.objects.get(email=login_field)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        
        if user is not None:
            login(request, user)
            # Get the next URL from the session if it exists
            next_url = request.session.get('next', 'store')
            # Clear the next URL from the session
            if 'next' in request.session:
                del request.session['next']
            return redirect(next_url)
        else:
            return render(request, 'login.html', {'error': 'Invalid username/email or password'})
            
    # If this is a GET request, store the next parameter in the session
    next_url = request.GET.get('next')
    if next_url:
        request.session['next'] = next_url
            
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('index')

def signup_view(request):
    if request.method == 'POST':
        # Get form data
        name = request.POST.get('name')
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        role = request.POST.get('role', 'buyer')  # Default to buyer if not specified

        # Validate passwords match
        if password != confirm_password:
            return render(request, 'signup.html', {'error': 'Passwords do not match'})

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already registered'})

        # Check if username is taken
        if User.objects.filter(username=username).exists():
            return render(request, 'signup.html', {'error': 'Username already taken'})

        try:
            # Create user with username and email
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Set the full name
            name_parts = name.split(' ', 1)
            user.first_name = name_parts[0]
            if len(name_parts) > 1:
                user.last_name = name_parts[1]
            user.save()

            # Create user profile with initial data and selected role
            profile = UserProfile.objects.create(
                user=user,
                role=role,  # Set the selected role
                display_name=name,  # Store full name in profile
                username=username  # Store username in profile
            )

            # Create an empty cart for the user
            Cart.objects.create(user=user)

            # Redirect to appropriate page based on role
            if role == 'farmer':
                return redirect('profile')  # Redirect to profile to complete farmer details
            elif role == 'landowner':
                return redirect('profile')  # Redirect to profile to complete landowner details
            else:
                return redirect('login')  # Default redirect for buyers

        except Exception as e:
            return render(request, 'signup.html', {'error': str(e)})

    return render(request, 'signup.html')

def store(request):
    # Get all categories with their products
    categories = Category.objects.all().prefetch_related('products')
    
    # Get featured products
    featured_products = Product.objects.filter(is_featured=True)
    
    context = {
        'categories': categories,
        'featured_products': featured_products,
    }
    return render(request, 'store.html', context)

def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    related_products = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]
    
    context = {
        'product': product,
        'related_products': related_products,
    }
    return render(request, 'product_detail.html', context)

def category_products(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        products = category.products.all()
        products_data = [{
            'id': product.id,
            'name': product.name,
            'price': str(product.price),
            'image': product.image.url if product.image else '',
            'stock': product.stock,
        } for product in products]
        return JsonResponse(products_data, safe=False)
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)

def category_products_api(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        products = category.products.all()
        products_data = [{
            'id': product.id,
            'name': product.name,
            'price': str(product.price),
            'image': request.build_absolute_uri(product.image.url) if product.image else '',
            'stock': product.stock,
        } for product in products]
        return JsonResponse(products_data, safe=False)
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)

def bot_view(request):
    return render(request, 'bot.html')

@login_required
@ensure_csrf_cookie
def checkout_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            
            if action == 'save_shipping':
                # Save shipping information
                shipping_info, created = UserShippingInfo.objects.get_or_create(user=request.user)
                shipping_info.full_name = data.get('fullName')
                shipping_info.address = data.get('address')
                shipping_info.city = data.get('city')
                shipping_info.country = data.get('country')
                shipping_info.phone = data.get('phone')
                shipping_info.save()
                return JsonResponse({'status': 'success'})
                
            elif action == 'save_payment':
                # Save payment information
                payment_info, created = UserPaymentInfo.objects.get_or_create(user=request.user)
                payment_info.card_name = data.get('cardName')
                payment_info.card_number = data.get('cardNumber')
                payment_info.expiry_date = data.get('expiry')
                payment_info.save()
                return JsonResponse({'status': 'success'})
            
            return JsonResponse({'error': 'Invalid action'}, status=400)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    # Get user's saved information
    try:
        shipping_info = UserShippingInfo.objects.get(user=request.user)
    except UserShippingInfo.DoesNotExist:
        shipping_info = None
        
    try:
        payment_info = UserPaymentInfo.objects.get(user=request.user)
    except UserPaymentInfo.DoesNotExist:
        payment_info = None
        
    try:
        cart = Cart.objects.get(user=request.user)
        cart_items = cart.items.all()
        subtotal = sum(item.product.price * item.quantity for item in cart_items)
        tax = subtotal * 0.08  # 8% tax
        total = subtotal + tax + 5.00  # Adding $5 shipping
    except Cart.DoesNotExist:
        cart_items = []
        subtotal = 0
        tax = 0
        total = 0
        
    context = {
        'shipping_info': shipping_info,
        'payment_info': payment_info,
        'cart_items': cart_items,
        'subtotal': "{:.2f}".format(subtotal),
        'tax': "{:.2f}".format(tax),
        'total': "{:.2f}".format(total),
    }
    
    return render(request, 'checkout.html', context)

def wishlist_view(request):
    return render(request, 'wishlist.html')

@login_required
def cart_view(request):
    """
    Render the shopping cart page.
    """
    return render(request, 'cart.html')

@login_required
@require_GET
def cart_data(request):
    """
    API endpoint to get cart data.
    Returns JSON response with cart items and total.
    """
    try:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.select_related('product').all()
        
        items_data = []
        total = 0
        
        for item in cart_items:
            product = item.product
            item_total = product.price * item.quantity
            total += item_total
            
            items_data.append({
                'id': product.id,
                'name': product.name,
                'price': str(product.price),
                'image': request.build_absolute_uri(product.image.url) if product.image else '',
                'quantity': item.quantity,
                'stock': product.stock,
                'total': str(item_total)
            })
        
        return JsonResponse({
            'items': items_data,
            'total': str(total)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_cart(request):
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if quantity < 1:
            return JsonResponse({'error': 'Quantity must be at least 1'}, status=400)
        
        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            product = Product.objects.get(id=product_id)
            
            if quantity > product.stock:
                return JsonResponse({'error': 'Not enough stock available'}, status=400)
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity = quantity
                cart_item.save()
            
            return JsonResponse({'success': True})
            
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def remove_from_cart(request):
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        
        cart = Cart.objects.get(user=request.user)
        cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        cart_item.delete()
        
        return JsonResponse({'success': True})
            
    except (Cart.DoesNotExist, CartItem.DoesNotExist):
        return JsonResponse({'error': 'Item not found in cart'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

@login_required
def admin_view(request):
    if not request.user.is_staff:
        return redirect('profile')
    
    # Get all products
    products = Product.objects.all()
    
    # Get all orders
    orders = Order.objects.all()
    
    # Get all users
    users = User.objects.all()
    
    # Get all categories
    categories = [
        {'name': 'Herbicides', 'product_count': Product.objects.filter(category='herbicides').count()},
        {'name': 'Pesticides', 'product_count': Product.objects.filter(category='pesticides').count()},
        {'name': 'Fertilizers', 'product_count': Product.objects.filter(category='fertilizers').count()},
        {'name': 'Seeds', 'product_count': Product.objects.filter(category='seeds').count()},
        {'name': 'Machinery', 'product_count': Product.objects.filter(category='machinery').count()},
        {'name': 'Insecticides', 'product_count': Product.objects.filter(category='insecticides').count()},
    ]
    
    context = {
        'products': products,
        'orders': orders,
        'users': users,
        'categories': categories,
    }
    
    return render(request, 'admin.html', context)

@login_required
def admin_products(request, product_id=None):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'POST':
        # Create new product
        name = request.POST.get('name')
        category = request.POST.get('category')
        price = request.POST.get('price')
        quantity = request.POST.get('quantity')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        
        product = Product.objects.create(
            name=name,
            category=category,
            price=price,
            quantity=quantity,
            description=description,
            image=image,
            farmer=request.user.profile
        )
        
        return JsonResponse({'success': True, 'product_id': product.id})
    
    elif request.method == 'DELETE':
        # Delete product
        try:
            product = Product.objects.get(id=product_id)
            product.delete()
            return JsonResponse({'success': True})
        except Product.DoesNotExist:
            return JsonResponse({'error': 'Product not found'}, status=404)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def admin_orders(request, order_id=None):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'PATCH':
        # Update order status
        try:
            order = Order.objects.get(id=order_id)
            data = json.loads(request.body)
            order.status = data.get('status')
            order.save()
            return JsonResponse({'success': True})
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=404)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def chat_view(request):
    return render(request, 'chat.html')

def get_product_details(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    data = {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': str(product.price),
        'sale_price': str(product.sale_price) if product.is_on_sale else None,
        'is_on_sale': product.is_on_sale,
        'stock': product.stock,
        'rating': product.rating,
        'image': product.image.url,
        'category': {
            'id': product.category.id,
            'name': product.category.name
        }
    }
    
    return JsonResponse(data)
