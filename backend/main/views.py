from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Product, Order, Category, Cart, CartItem, UserShippingInfo, UserPaymentInfo, Wishlist, WishlistItem, Land
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
from django.db.models import Q
from decimal import Decimal
from django.shortcuts import render
from django.http import JsonResponse
from .utils.openrouter import ask_openrouter


# Create your views here.

def index(request):
    return render(request, 'index.html')

@login_required
def profile_view(request):
    # Debug logs
    print("📥 Request method:", request.method)
    print("📥 Headers:", dict(request.headers))
    print("📥 POST data:", dict(request.POST))
    print("📥 FILES:", dict(request.FILES))
    print("📥 Content-Type:", request.content_type)
    
    # Get the user's profile or create one if it doesn't exist
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Determine which profile types are accessible based on user role
    accessible_profiles = ['base']  # Base profile is always accessible
    
    if profile.role == 'farmer':
        accessible_profiles.append('farmer')
    elif profile.role == 'landowner':
        accessible_profiles.append('landowner')
    
    if request.method == 'POST':
        # Check if it's an AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        print("📥 Is AJAX request:", is_ajax)
        
        try:
            # Handle base profile form submission
            if request.POST.get('form_type') == 'base_profile':
                # Update user's first and last name if provided
                full_name = request.POST.get('fullName', '').strip()
                if full_name:
                    name_parts = full_name.split(' ', 1)
                    request.user.first_name = name_parts[0]
                    request.user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                    request.user.save()
                
                # Update profile fields if provided
                if 'phone' in request.POST:
                    profile.phone = request.POST.get('phone')
                if 'location' in request.POST:
                    profile.location = request.POST.get('location')
                
                # Handle profile picture
                if 'profile_picture' in request.FILES:
                    print("📥 Profile picture received:", request.FILES['profile_picture'])
                    # Delete old profile picture if it exists
                    if profile.profile_picture:
                        try:
                            profile.profile_picture.delete(save=False)
                        except Exception as e:
                            print("❌ Error deleting old profile picture:", str(e))
                    
                    profile.profile_picture = request.FILES['profile_picture']
                
                profile.save()
                
                if is_ajax:
                    return JsonResponse({
                    'status': 'success',
                    'message': 'Profile updated successfully',
                    'data': {
                        'fullName': f"{request.user.first_name} {request.user.last_name}".strip(),
                    'phone': profile.phone,
                            'location': profile.location,
                            'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None
                    }
                })
                return redirect('profile')
            
            # Handle farmer profile form submission
            elif request.POST.get('form_type') == 'farmer_profile':
                try:
                    print("📥 Processing farmer profile form")
                    print("📥 Form data:", dict(request.POST))
                    
                    # Update farmer-specific fields
                    profile.farming_method = request.POST.get('farming_method', '')
                    try:
                        profile.experience_years = int(request.POST.get('experience_years', 0))
                    except (ValueError, TypeError):
                        profile.experience_years = 0
                    
                    # Handle arrays with better error handling
                    def parse_json_array(json_str, field_name):
                        try:
                            if not json_str or json_str == '[]':
                                return []
                            data = json.loads(json_str)
                            if not isinstance(data, list):
                                print(f"❌ {field_name} is not a list:", data)
                                return []
                            return data
                        except json.JSONDecodeError as e:
                            print(f"❌ Error decoding {field_name} JSON:", json_str)
                            print(f"❌ Error details:", str(e))
                            return []
                    
                    # Parse arrays with better error handling
                    profile.crops = parse_json_array(request.POST.get('crops[]', '[]'), 'crops')
                    profile.livestock = parse_json_array(request.POST.get('livestock[]', '[]'), 'livestock')
                    profile.equipment = parse_json_array(request.POST.get('equipment[]', '[]'), 'equipment')
                    
                    # Handle profile picture
                    if 'profile_picture' in request.FILES:
                        print("📥 Profile picture received:", request.FILES['profile_picture'])
                        profile.profile_picture = request.FILES['profile_picture']
                    
                    # Save the profile
                    try:
                        profile.save()
                        print("✅ Farmer profile saved successfully")
                        
                        if is_ajax:
                            return JsonResponse({
                                'status': 'success',
                                'message': 'Farmer profile updated successfully',
                                'data': {
                                    'farming_method': profile.farming_method,
                                    'experience_years': profile.experience_years,
                                    'crops': profile.crops,
                                    'livestock': profile.livestock,
                                    'equipment': profile.equipment
                                }
                            })
                        return redirect('profile')
                    except Exception as e:
                        print("❌ Error saving profile:", str(e))
                        if is_ajax:
                            return JsonResponse({
                                'status': 'error',
                                'message': f'Error saving profile: {str(e)}'
                            }, status=500)
                        return redirect('profile')
                        
                except Exception as e:
                    print("❌ Error processing farmer profile:", str(e))
                    if is_ajax:
                        return JsonResponse({
                            'status': 'error',
                            'message': f'Error processing form: {str(e)}'
                        }, status=400)
                    return redirect('profile')
            
            # Handle land listing form submission
            elif request.POST.get('form_type') == 'land_listing':
                try:
                    # Create new land listing
                    land = Land.objects.create(
                        owner=profile,
                        title=request.POST.get('title', 'Land Property'),
                        location=request.POST.get('location', ''),
                        size=float(request.POST.get('size', 0)),
                        land_type=request.POST.get('landType', 'Agricultural'),
                        price=float(request.POST.get('price', 0)),
                        description=request.POST.get('description', ''),
                        is_available=True
                    )
                    
                    # Handle land images
                    if 'landImages' in request.FILES:
                        for image in request.FILES.getlist('landImages'):
                            # Save the image to the land's image field
                            land.image = image
                            land.save()
                    
                    if is_ajax:
                        return JsonResponse({
                            'status': 'success',
                            'message': 'Land listing created successfully',
                            'data': {
                                'id': land.id,
                                'title': land.title,
                                'location': land.location,
                                'size': str(land.size),
                                'land_type': land.land_type,
                                'price': str(land.price),
                                'description': land.description
                            }
                        })
                    return redirect('profile')
                except ValueError as e:
                    if is_ajax:
                        return JsonResponse({
                            'status': 'error',
                            'message': f'Invalid input: {str(e)}'
                        }, status=400)
                    return redirect('profile')
            
            # Handle landowner profile form submission
            elif request.POST.get('form_type') == 'landowner_profile':
                try:
                    # Create new land listing
                    land = Land.objects.create(
                        owner=profile,
                        title='Land Property',  # Default title
                        location=request.POST.get('location', ''),
                        size=float(request.POST.get('land_size', 0)),
                        soil_type=request.POST.get('soil_type', 'Loam'),
                        water_source=request.POST.get('water_source', 'Well'),
                        lease_terms=request.POST.get('lease_terms', ''),
                        price_per_acre=float(request.POST.get('price_per_acre', 0)),
                        description=request.POST.get('description', ''),
                        is_available=True
                    )
                    
                    # Handle land images
                    if 'land_images' in request.FILES:
                        for image in request.FILES.getlist('land_images'):
                            # Save the image to the land's image field
                            land.image = image
                            land.save()
                    
                    if is_ajax:
                        return JsonResponse({
                            'status': 'success',
                            'message': 'Land listing created successfully',
                            'data': {
                                'id': land.id,
                                'location': land.location,
                                'size': str(land.size),
                                'soil_type': land.soil_type,
                                'water_source': land.water_source,
                                'lease_terms': land.lease_terms,
                                'price_per_acre': str(land.price_per_acre),
                                'description': land.description
                            }
                        })
                    return redirect('profile')
                except ValueError as e:
                    if is_ajax:
                        return JsonResponse({
                            'status': 'error',
                            'message': f'Invalid input: {str(e)}'
                        }, status=400)
                    return redirect('profile')
            
            # Handle password change form
            elif request.POST.get('form_type') == 'password_change':
                try:
                    # Get form data
                    current_password = request.POST.get('current_password')
                    new_password = request.POST.get('new_password')
                    confirm_password = request.POST.get('confirm_password')
                    
                    # Validate form data
                    if not current_password or not new_password or not confirm_password:
                        raise ValueError("All password fields are required")
                    
                    if new_password != confirm_password:
                        raise ValueError("New passwords don't match")
                    
                    # Check if current password is correct
                    user = request.user
                    if not user.check_password(current_password):
                        raise ValueError("Current password is incorrect")
                    
                    # Set the new password
                    user.set_password(new_password)
                    user.save()
                    
                    # Update the session to prevent logout
                    update_session_auth_hash(request, user)
                    
                    if is_ajax:
                        return JsonResponse({
                            'status': 'success',
                            'message': 'Password updated successfully'
                        })
                    return redirect('profile')
                except ValueError as e:
                    if is_ajax:
                        return JsonResponse({
                            'status': 'error',
                            'message': str(e)
                        }, status=400)
                    return redirect('profile')
            
            # If no form type matches
            if is_ajax:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid form type'
                }, status=400)
            return redirect('profile')
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Print stack trace for debugging
            if is_ajax:
                return JsonResponse({
                'status': 'error',
                'message': str(e)
                }, status=500)
            return redirect('profile')
    
    # For GET requests, render the profile page
    context = {
        'profile': profile,
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

def product_detail(request, product_id=None, pk=None):
    # Use either product_id or pk parameter (pk is used by DRF router)
    product_id = product_id or pk
    product = get_object_or_404(Product, id=product_id)
    
    # Check if request is AJAX or has Accept: application/json header
    # This helps determine if it's an API call or direct browser request
    is_api_request = (
        request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 
        'application/json' in request.headers.get('Accept', '')
    )
    
    # If URL starts with /api/ or is_api_request is True, return JSON
    if request.path.startswith('/api/') or is_api_request:
        data = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': str(product.price),
            'sale_price': str(product.sale_price) if product.is_on_sale else None,
            'is_on_sale': product.is_on_sale,
            'stock': product.stock,
            'rating': product.rating,
            'image': request.build_absolute_uri(product.image.url) if product.image else '',
            'category': {
                'id': product.category.id,
                'name': product.category.name
            } if product.category else None
        }
        return JsonResponse(data)
    
    # For regular web requests, render HTML template
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
    category = get_object_or_404(Category, id=category_id)
    products = Product.objects.filter(category=category)
    data = ProductSerializer(products, many=True).data
    return JsonResponse(data, safe=False)

def bot_view(request):
    return render(request, 'bot.html')

@require_http_methods(["POST"])
def bot_chat_api(request):
    """
    API endpoint for the bot chat functionality.
    Receives user messages and returns AI responses using OpenRouter.
    """
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '')
        
        if not user_message:
            return JsonResponse({'error': 'Message is required'}, status=400)
            
        # Use OpenRouter to get a response
        response_text = ask_openrouter(
            prompt=user_message,
            model="openai/gpt-3.5-turbo",
            max_tokens=200
        )
        
        return JsonResponse({
            'response': response_text,
            'timestamp': timezone.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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
        tax = subtotal * Decimal('0.08')  # 8% tax
        total = subtotal + tax + Decimal('5.00')  # Adding $5 shipping
    except Cart.DoesNotExist:
        cart_items = []
        subtotal = Decimal('0')
        tax = Decimal('0')
        total = Decimal('0')
        
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
    
    # Get all categories from the database
    categories = Category.objects.all()
    # Add product count to each category
    for category in categories:
        category.product_count = Product.objects.filter(category=category).count()
    
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

@login_required
def toggle_wishlist(request, product_id):
    if request.method == 'POST':
        try:
            product = Product.objects.get(id=product_id)
            wishlist, created = Wishlist.objects.get_or_create(user=request.user)
            
            # Check if product is already in wishlist
            wishlist_item = WishlistItem.objects.filter(wishlist=wishlist, product=product).first()
            
            if wishlist_item:
                # Remove from wishlist
                wishlist_item.delete()
                return JsonResponse({'status': 'removed', 'message': 'Product removed from wishlist'})
            else:
                # Add to wishlist
                WishlistItem.objects.create(wishlist=wishlist, product=product)
                return JsonResponse({'status': 'added', 'message': 'Product added to wishlist'})
                
        except Product.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

@login_required
@ensure_csrf_cookie
def add_to_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            quantity = data.get('quantity', 1)
            
            # Log the request data for debugging
            print(f"Adding to cart: product_id={product_id}, quantity={quantity}")
            
            product = Product.objects.get(id=product_id)
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Check if product is already in cart
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Product added to cart',
                'cart_total': cart.total_items
            })
            
        except Product.DoesNotExist:
            print(f"Product not found: {product_id}")
            return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"Error adding to cart: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

@login_required
def get_wishlist_status(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        wishlist = Wishlist.objects.filter(user=request.user).first()
        
        is_in_wishlist = False
        if wishlist:
            is_in_wishlist = WishlistItem.objects.filter(wishlist=wishlist, product=product).exists()
        
        return JsonResponse({
            'status': 'success',
            'is_in_wishlist': is_in_wishlist
        })
        
    except Product.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def create_category(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        data = json.loads(request.body)
        category = Category.objects.create(
            name=data['name'],
            icon=data['icon'],
            description=data.get('description', ''),
            status=data.get('status', 'active')  # Default to active if not provided
        )
        return JsonResponse({
            'success': True,
            'category': {
                'id': category.id,
                'name': category.name,
                'icon': category.icon,
                'description': category.description,
                'status': category.status
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@ensure_csrf_cookie
def landowner(request):
    # Get all available lands with their owner information
    lands = Land.objects.filter(is_available=True).select_related('owner__user')
    
    # Get the user's profile
    user_profile = UserProfile.objects.get(user=request.user)
    
    context = {
        'lands': lands,
        'is_landowner': user_profile.role == 'landowner',
        'user_role': user_profile.role
    }
    return render(request, 'landowner.html', context)

@login_required
def update_land(request, land_id):
    """Handle AJAX requests to update a land listing"""
    try:
        land = Land.objects.get(id=land_id)
        
        # Check if the user is the owner of the land
        if land.owner.user != request.user:
            return JsonResponse({
                'status': 'error',
                'message': 'You do not have permission to edit this land listing'
            }, status=403)
        
        if request.method == 'POST':
            # Update land fields
            land.title = request.POST.get('title', land.title)
            land.location = request.POST.get('location', land.location)
            land.size = float(request.POST.get('size', land.size))
            land.soil_type = request.POST.get('soil_type', land.soil_type)
            land.water_source = request.POST.get('water_source', land.water_source)
            land.lease_terms = request.POST.get('lease_terms', land.lease_terms)
            land.price_per_acre = float(request.POST.get('price_per_acre', land.price_per_acre))
            land.description = request.POST.get('description', land.description)
            
            # Handle land image
            if 'land_image' in request.FILES:
                land.image = request.FILES['land_image']
            
            # Save the land
            land.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Land listing updated successfully'
            })
        
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid request method'
        }, status=405)
        
    except Land.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Land listing not found'
        }, status=404)
    except ValueError as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Invalid input: {str(e)}'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def add_land_ajax(request):
    """Handle AJAX requests to add a new land listing"""
    # Check if user is a landowner
    profile = UserProfile.objects.get(user=request.user)
    if profile.role != 'landowner':
        return JsonResponse({
            'status': 'error',
            'message': 'Only landowners can add land listings'
        }, status=403)
    
    if request.method == 'POST':
        try:
            # Create new land listing
            land = Land.objects.create(
                owner=profile,
                title=request.POST.get('title', 'Land Property'),
                location=request.POST.get('location', ''),
                size=float(request.POST.get('size', 0)),
                soil_type=request.POST.get('soil_type', 'Loam'),
                water_source=request.POST.get('water_source', 'Well'),
                lease_terms=request.POST.get('lease_terms', ''),
                price_per_acre=float(request.POST.get('price_per_acre', 0)),
                price=float(request.POST.get('price_per_acre', 0)) * float(request.POST.get('size', 0)),
                description=request.POST.get('description', ''),
                is_available=True
            )
            
            # Handle land image
            if 'land_image' in request.FILES:
                land.image = request.FILES['land_image']
                land.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Land listing created successfully'
            })
            
        except ValueError as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Invalid input: {str(e)}'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=405)

@login_required
def farmers(request):
    # Get all profiles with role 'farmer' and prefetch related user data
    farmer_profiles = UserProfile.objects.select_related('user').filter(
        role='farmer'
    ).exclude(
        Q(farming_method='') | Q(farming_method__isnull=True),
        Q(experience_years__isnull=True) | Q(experience_years=0),
        Q(crops__isnull=True) | Q(crops=[]),
        Q(livestock__isnull=True) | Q(livestock=[])
    )

    # Process each profile to ensure data is properly formatted
    processed_profiles = []
    for profile in farmer_profiles:
        processed_profile = {
            'id': profile.id,
            'name': profile.get_display_name(),
            'location': profile.location or "JADRAa",
            'experience_years': profile.experience_years or 0,
            'farming_method': profile.farming_method or "Not specified",
            'crops': profile.crops or [],
            'livestock': profile.livestock or [],
            'equipment': profile.equipment or [],
            'email': profile.user.email,
            'phone': profile.phone or "Not provided",
            'profile_picture': profile.profile_picture if profile.profile_picture else None
        }
        processed_profiles.append(processed_profile)
    
    context = {
        'farmer_profiles': processed_profiles,
        'page_title': 'Meet Our Farmers'
    }
    return render(request, 'farmers.html', context)

@login_required
@require_http_methods(["DELETE"])
def delete_land(request, land_id):
    try:
        land = Land.objects.get(id=land_id)
        
        # Check if the user is the owner of the land
        if land.owner.user != request.user:
            return JsonResponse({
                'status': 'error',
                'message': 'You do not have permission to delete this land listing'
            }, status=403)
        
        # Delete the land
        land.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Land listing deleted successfully'
        })
        
    except Land.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Land listing not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def edit_land(request, land_id):
    # Get the land listing
    try:
        land = Land.objects.get(id=land_id)
        
        # Check if the user is the owner of the land
        if land.owner.user != request.user:
            return redirect('landowner')
        
        if request.method == 'POST':
            # Handle form submission
            try:
                # Update land fields
                land.title = request.POST.get('title', land.title)
                land.location = request.POST.get('location', land.location)
                land.size = float(request.POST.get('size', land.size))
                land.soil_type = request.POST.get('soil_type', land.soil_type)
                land.water_source = request.POST.get('water_source', land.water_source)
                land.lease_terms = request.POST.get('lease_terms', land.lease_terms)
                land.price_per_acre = float(request.POST.get('price_per_acre', land.price_per_acre))
                land.description = request.POST.get('description', land.description)
                
                # Handle land image
                if 'land_image' in request.FILES:
                    land.image = request.FILES['land_image']
                
                # Save the land
                land.save()
                
                # Redirect to landowner page
                return redirect('landowner')
                
            except ValueError as e:
                # Handle validation errors
                context = {
                    'land': land,
                    'error': f'Invalid input: {str(e)}'
                }
                return render(request, 'edit_land.html', context)
        
        # For GET requests, render the edit form
        context = {
            'land': land
        }
        return render(request, 'edit_land.html', context)
        
    except Land.DoesNotExist:
        return redirect('landowner')

@login_required
def add_land(request):
    # Check if user is a landowner
    profile = UserProfile.objects.get(user=request.user)
    if profile.role != 'landowner':
        return redirect('profile')
    
    if request.method == 'POST':
        # Handle form submission
        try:
            # Create new land listing
            land = Land.objects.create(
                owner=profile,
                title=request.POST.get('title', 'Land Property'),
                location=request.POST.get('location', ''),
                size=float(request.POST.get('size', 0)),
                soil_type=request.POST.get('soil_type', 'Loam'),
                water_source=request.POST.get('water_source', 'Well'),
                lease_terms=request.POST.get('lease_terms', ''),
                price_per_acre=float(request.POST.get('price_per_acre', 0)),
                price=float(request.POST.get('price_per_acre', 0)) * float(request.POST.get('size', 0)),
                description=request.POST.get('description', ''),
                is_available=True
            )
            
            # Handle land image
            if 'land_image' in request.FILES:
                land.image = request.FILES['land_image']
                land.save()
            
            # Redirect to landowner page
            return redirect('landowner')
            
        except ValueError as e:
            # Handle validation errors
            context = {
                'error': f'Invalid input: {str(e)}'
            }
            return render(request, 'add_land.html', context)
    
    # For GET requests, render the add form
    context = {}
    return render(request, 'add_land.html', context)

@require_GET
def get_categories(request):
    categories = Category.objects.all()
    data = [{
        'id': category.id,
        'name': category.name,
        'icon': category.icon,
        'description': category.description,
        'product_count': category.products.count()
    } for category in categories]
    return JsonResponse(data, safe=False)
