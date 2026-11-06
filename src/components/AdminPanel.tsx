import React, { useState } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  CheckCheck,
  Search,
  MessageCircle,
  Save,
  RotateCcw,
  LogOut,
  ArrowLeft,
  Settings,
  Layers,
  Sparkles,
  Database,
  Loader2,
  Upload,
  Image as ImageIcon,
  Heart
} from 'lucide-react';
import { Product, Order, OrderStatus, StoreSettings } from '../types/store';
import { formatCOP, formatDateCO } from '../utils/formatters';
import { storeService, DEFAULT_HERO_SETTINGS } from '../services/storeService';
import { AdminUser } from '../services/authService';
import { BeautyImage } from './BeautyImage';

interface AdminPanelProps {
  user: AdminUser;
  onLogout: () => void;
  onBackToStore: () => void;
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  onLogout,
  onBackToStore,
  products,
  orders,
  settings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos' | 'configuracion'>('pedidos');
  
  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Products filter & search
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('todos');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Product Modal (Create / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<{
    name: string;
    shortDescription: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: Product['category'];
    stock: number;
    imageUrl: string;
    isFeatured: boolean;
    benefits: string;
    ingredients: string;
    howToUse: string;
  }>({
    name: '',
    shortDescription: '',
    description: '',
    price: 35000,
    originalPrice: undefined,
    category: 'Rostro',
    stock: 10,
    imageUrl: '',
    isFeatured: false,
    benefits: '',
    ingredients: '',
    howToUse: '',
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [adminActionFeedback, setAdminActionFeedback] = useState<string | null>(null);

  // In-app Confirmation Modal States (replaces blocked native confirm dialogs)
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; customerName: string; total: number } | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const [showResetCatalogModal, setShowResetCatalogModal] = useState(false);
  const [isResettingCatalog, setIsResettingCatalog] = useState(false);

  const showFeedback = (msg: string) => {
    setAdminActionFeedback(msg);
    setTimeout(() => {
      setAdminActionFeedback((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Hero Image compression state
  const [isCompressingHeroImage, setIsCompressingHeroImage] = useState(false);

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    setIsCompressingHeroImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let compressedData = '';
          try {
            compressedData = canvas.toDataURL('image/webp', 0.82);
          } catch {
            compressedData = '';
          }
          if (!compressedData || !compressedData.startsWith('data:image/webp')) {
            compressedData = canvas.toDataURL('image/jpeg', 0.82);
          }
          setSettingsForm((prev) => ({
            ...prev,
            heroImageUrl: compressedData,
          }));
          showFeedback('¡Imagen optimizada con éxito! Haz clic en "Guardar Configuración" para publicarla.');
        }
        setIsCompressingHeroImage(false);
      };
      img.onerror = () => {
        setIsCompressingHeroImage(false);
        showFeedback('No se pudo procesar la imagen seleccionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsCompressingHeroImage(false);
      showFeedback('No se pudo leer el archivo desde el dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreHeroDefaults = () => {
    setSettingsForm((prev) => ({
      ...prev,
      ...DEFAULT_HERO_SETTINGS,
    }));
    showFeedback('Textos e imagen de la portada restaurados a los valores oficiales. Guarda para confirmar.');
  };

  // Sync settings whenever updated settings arrive
  React.useEffect(() => {
    const s = { ...settings };
    if (!s.heroButtonText || s.heroButtonText.includes('favoritos') || s.heroButtonText === 'Explorar Catálogo') {
      s.heroButtonText = 'Explorar Catálogo ✦';
    }
    setSettingsForm(s);
  }, [settings]);

  // Derived real KPI metrics (strictly authentic, no fake data)
  const confirmedOrders = orders.filter((o) => o.status !== 'pendiente');
  const confirmedSalesRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente').length;
  const lowStockCount = products.filter((p) => p.stock <= 3).length;

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === 'todos' || order.status === orderStatusFilter;
    const query = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      order.id.toLowerCase().includes(query) ||
      order.customer.fullName.toLowerCase().includes(query) ||
      order.customer.city.toLowerCase().includes(query) ||
      order.customer.phone.includes(query);
    return matchesStatus && matchesSearch;
  });

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      productCategoryFilter === 'todos' || product.category === productCategoryFilter;
    const query = productSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // Status Change handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await storeService.updateOrderStatus(orderId, newStatus);
      onRefreshData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      showFeedback(`Pedido #${orderId} actualizado a estado "${newStatus.toUpperCase()}" ${newStatus === 'confirmado' ? '(existencias descontadas en inventario)' : ''}.`);
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Stock Quick Adjust
  const handleQuickStockChange = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await storeService.updateStock(productId, newStock);
      onRefreshData();
      showFeedback(`Stock actualizado a ${newStock} unidades.`);
    } catch (e) {
      console.error('Error updating stock:', e);
    }
  };

  // Open Create Product
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      shortDescription: '',
      description: '',
      price: 45000,
      originalPrice: undefined,
      category: 'Rostro',
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      isFeatured: false,
      benefits: 'Fórmula hidratante\nAlta duración\nCruelty-free',
      ingredients: 'Extractos botánicos, Vitamina E, Aceite de Jojoba',
      howToUse: 'Aplicar suavemente sobre el rostro con movimientos circulares.',
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductFormData({
      name: prod.name,
      shortDescription: prod.shortDescription,
      description: prod.description,
      price: prod.price,
      originalPrice: prod.originalPrice,
      category: prod.category,
      stock: prod.stock,
      imageUrl: prod.imageUrl,
      isFeatured: !!prod.isFeatured,
      benefits: prod.benefits ? prod.benefits.join('\n') : '',
      ingredients: prod.ingredients || '',
      howToUse: prod.howToUse || '',
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Create / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const benefitsList = productFormData.benefits
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    try {
      if (editingProduct) {
        await storeService.updateProduct(editingProduct.id, {
          name: productFormData.name,
          shortDescription: productFormData.shortDescription,
          description: productFormData.description,
          price: Number(productFormData.price),
          originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : undefined,
          category: productFormData.category,
          stock: Number(productFormData.stock),
          imageUrl: productFormData.imageUrl,
          isFeatured: productFormData.isFeatured,
          benefits: benefitsList,
          ingredients: productFormData.ingredients,
          howToUse: productFormData.howToUse,
        });
        showFeedback(`Producto "${productFormData.name}" actualizado y guardado correctamente.`);
      } else {
        await storeService.addProduct({
          name: productFormData.name,
          shortDescription: productFormData.shortDescription,
          description: productFormData.description,
          price: Number(productFormData.price),
          originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : undefined,
          category: productFormData.category,
          stock: Number(productFormData.stock),
          imageUrl: productFormData.imageUrl,
          isFeatured: productFormData.isFeatured,
          benefits: benefitsList,
          ingredients: productFormData.ingredients,
          howToUse: productFormData.howToUse,
        });
        showFeedback(`Producto "${productFormData.name}" creado y añadido al inventario.`);
      }

      setIsProductModalOpen(false);
      onRefreshData();
    } catch (e) {
      console.error('Error saving product:', e);
    }
  };

  // Delete product - open confirmation modal
  const handleDeleteProductClick = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const prodName = productToDelete.name;
      await storeService.deleteProduct(productToDelete.id);
      onRefreshData();
      showFeedback(`Producto "${prodName}" eliminado correctamente del catálogo.`);
      setProductToDelete(null);
    } catch (e) {
      console.error('Error deleting product:', e);
      showFeedback('Ocurrió un error al eliminar el producto. Inténtalo de nuevo.');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Delete order - open confirmation modal
  const handleDeleteOrderClick = (orderId: string, customerName: string, total: number) => {
    setOrderToDelete({ id: orderId, customerName, total });
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      const targetId = orderToDelete.id;
      const targetCustomer = orderToDelete.customerName;
      await storeService.deleteOrder(targetId);
      onRefreshData();
      if (selectedOrder?.id === targetId) {
        setSelectedOrder(null);
      }
      showFeedback(`Pedido #${targetId} de "${targetCustomer}" eliminado y espacio liberado.`);
      setOrderToDelete(null);
    } catch (e) {
      console.error('Error deleting order:', e);
      showFeedback('Ocurrió un error al eliminar el pedido.');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated = await storeService.saveSettings(settingsForm);
      setSettingsForm({ ...updated });
      onRefreshData();
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset demo catalog
  const handleConfirmResetCatalog = async () => {
    setIsResettingCatalog(true);
    try {
      await storeService.resetCatalogToDefault();
      onRefreshData();
      showFeedback('Catálogo restablecido correctamente con los 10 productos oficiales.');
      setShowResetCatalogModal(false);
    } catch (e) {
      console.error('Error resetting catalog:', e);
      showFeedback('No se pudo restablecer el catálogo.');
    } finally {
      setIsResettingCatalog(false);
    }
  };

  // Status helper rendering
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente
          </span>
        );
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Confirmado
          </span>
        );
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
            <Package className="w-3.5 h-3.5 text-purple-600" />
            Preparando
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            Enviado
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            Entregado
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#382A30] font-sans pb-16">
      
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8BFCB]/50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToStore}
              className="p-2 text-[#382A30]/70 hover:text-[#B9788B] hover:bg-[#F7E5E9]/50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Volver a la tienda pública"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </button>
            <div className="h-4 w-px bg-[#E8BFCB]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/dulzara_logo_transparent.png"
                  alt="Dulzara Logo"
                  className="w-full h-full object-contain pointer-events-none mix-blend-multiply"
                />
              </div>
              <div>
                <span className="text-lg font-serif-brand font-semibold text-[#382A30]">
                  DULZARA
                </span>
                <span className="ml-2 text-xs text-[#B9788B] font-medium hidden sm:inline">
                  Panel Administrativo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-[#382A30] block">
                {user.name}
              </span>
              <span className="text-[11px] text-[#382A30]/60">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 border border-red-200"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Real KPI Strip (No mock stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 bg-white rounded-2xl border border-[#E8BFCB]/60 shadow-xs">
            <div className="flex items-center justify-between text-[#382A30]/70 text-xs mb-2">
              <span>Ventas Confirmadas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-[#382A30] tabular-nums">
              {formatCOP(confirmedSalesRevenue)}
            </div>
            <div className="text-[11px] text-[#382A30]/60 mt-1">
              {confirmedOrders.length} pedidos confirmados/enviados
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E8BFCB]/60 shadow-xs">
            <div className="flex items-center justify-between text-[#382A30]/70 text-xs mb-2">
              <span>Pedidos por Gestionar</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">
              {pendingOrdersCount}
            </div>
            <div className="text-[11px] text-[#382A30]/60 mt-1">
              {orders.length} pedidos registrados en total
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E8BFCB]/60 shadow-xs">
            <div className="flex items-center justify-between text-[#382A30]/70 text-xs mb-2">
              <span>Catálogo Activo</span>
              <Package className="w-4 h-4 text-[#B9788B]" />
            </div>
            <div className="text-2xl font-bold text-[#382A30] tabular-nums">
              {products.length}
            </div>
            <div className="text-[11px] text-[#382A30]/60 mt-1">
              Productos disponibles en la tienda
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E8BFCB]/60 shadow-xs">
            <div className="flex items-center justify-between text-[#382A30]/70 text-xs mb-2">
              <span>Alertas de Inventario</span>
              <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div className={`text-2xl font-bold tabular-nums ${lowStockCount > 0 ? 'text-amber-700' : 'text-[#382A30]'}`}>
              {lowStockCount}
            </div>
            <div className="text-[11px] text-[#382A30]/60 mt-1">
              Productos con 3 o menos existencias
            </div>
          </div>

        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-between border-b border-[#E8BFCB]/50 pb-3">
          <div className="flex items-center gap-2 p-1 bg-[#F7E5E9]/50 rounded-xl border border-[#E8BFCB]/50">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'pedidos'
                  ? 'bg-white text-[#382A30] shadow-xs font-semibold'
                  : 'text-[#382A30]/70 hover:text-[#382A30]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#B9788B]" />
              <span>Pedidos Recibidos ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'productos'
                  ? 'bg-white text-[#382A30] shadow-xs font-semibold'
                  : 'text-[#382A30]/70 hover:text-[#382A30]'
              }`}
            >
              <Layers className="w-4 h-4 text-[#B9788B]" />
              <span>Productos e Inventario ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'configuracion'
                  ? 'bg-white text-[#382A30] shadow-xs font-semibold'
                  : 'text-[#382A30]/70 hover:text-[#382A30]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#B9788B]" />
              <span>Ajustes & Firebase</span>
            </button>
          </div>

          {activeTab === 'productos' && (
            <button
              onClick={handleOpenCreateProduct}
              className="px-4 py-2 bg-[#B9788B] hover:bg-[#a6687a] text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>

        {/* Dynamic Action Feedback Alert */}
        {adminActionFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminActionFeedback}</span>
            </div>
            <button
              onClick={() => setAdminActionFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded-full"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            
            {/* Filter and search bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3.5 rounded-2xl border border-[#E8BFCB]/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#382A30]/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente, ciudad..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#382A30]/70 font-medium">Estado:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-[#E8BFCB] bg-white focus:outline-none text-[#382A30]"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="preparando">Preparando</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#E8BFCB]/60 overflow-hidden shadow-xs">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#382A30]/60 space-y-2">
                  <p>No se encontraron pedidos con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7E5E9]/50 text-[#382A30] uppercase text-[10px] tracking-wider border-b border-[#E8BFCB]/40 font-semibold">
                      <tr>
                        <th className="py-3.5 px-4">Ref. Pedido</th>
                        <th className="py-3.5 px-4">Fecha</th>
                        <th className="py-3.5 px-4">Cliente / Contacto</th>
                        <th className="py-3.5 px-4">Destino</th>
                        <th className="py-3.5 px-4">Productos</th>
                        <th className="py-3.5 px-4 text-right">Total</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7E5E9]">
                      {filteredOrders.map((order) => {
                        const totalUnits = order.items.reduce((s, it) => s + it.quantity, 0);
                        return (
                          <tr key={order.id} className="hover:bg-[#FFFDF9]/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#382A30]">
                              #{order.id}
                            </td>
                            <td className="py-3.5 px-4 text-[#382A30]/70 whitespace-nowrap">
                              {formatDateCO(order.createdAt)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-[#382A30] block">
                                {order.customer.fullName}
                              </span>
                              <a
                                href={`https://wa.me/57${order.customer.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#25D366] hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{order.customer.phone}</span>
                              </a>
                            </td>
                            <td className="py-3.5 px-4 text-[#382A30]/80">
                              <span>{order.customer.city}, {order.customer.department}</span>
                              <span className="text-[11px] text-[#382A30]/60 block truncate max-w-xs">
                                {order.customer.address}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#382A30]">
                              <span>{order.items.length} ítems ({totalUnits} unid.)</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#382A30]">
                              {formatCOP(order.total)}
                            </td>
                            <td className="py-3.5 px-4">
                              {/* Direct Status Selector */}
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                className="text-xs py-1 px-2 rounded-lg border border-[#E8BFCB] bg-white font-medium focus:outline-none"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="preparando">Preparando</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregado">Entregado</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-2.5 py-1 text-xs font-medium text-[#B9788B] hover:bg-[#F7E5E9] rounded-lg border border-[#E8BFCB] transition-colors"
                                  title="Ver detalles completos del pedido"
                                >
                                  Ver Detalle
                                </button>
                                <button
                                  onClick={() => handleDeleteOrderClick(order.id, order.customer.fullName, order.total)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                                  title="Eliminar pedido y liberar espacio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PRODUCTOS E INVENTARIO */}
        {activeTab === 'productos' && (
          <div className="space-y-4">
            
            {/* Filter and search */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3.5 rounded-2xl border border-[#E8BFCB]/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#382A30]/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#382A30]/70 font-medium">Categoría:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-[#E8BFCB] bg-white focus:outline-none text-[#382A30]"
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="Rostro">Rostro</option>
                  <option value="Ojos y Cejas">Ojos y Cejas</option>
                  <option value="Labios">Labios</option>
                  <option value="Skincare y Cuidado">Skincare y Cuidado</option>
                  <option value="Kits y Accesorios">Kits y Accesorios</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#E8BFCB]/60 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7E5E9]/50 text-[#382A30] uppercase text-[10px] tracking-wider border-b border-[#E8BFCB]/40 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Producto</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4 text-right">Precio</th>
                      <th className="py-3.5 px-4 text-center">Stock en Bodega</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7E5E9]">
                    {filteredProducts.map((prod) => {
                      const isLow = prod.stock <= 3;
                      const isZero = prod.stock === 0;
                      return (
                        <tr key={prod.id} className="hover:bg-[#FFFDF9]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#F7E5E9]/40 border border-[#E8BFCB]/30">
                                <BeautyImage
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  category={prod.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-semibold text-[#382A30] block">
                                  {prod.name}
                                </span>
                                <span className="text-[11px] text-[#382A30]/50 line-clamp-1 max-w-sm">
                                  {prod.shortDescription}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] uppercase tracking-wider text-[#B9788B] font-medium">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#382A30]">
                            {formatCOP(prod.price)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {/* Direct Quick Stock Control */}
                            <div className="inline-flex items-center border border-[#E8BFCB] rounded-lg bg-white overflow-hidden">
                              <button
                                onClick={() => handleQuickStockChange(prod.id, prod.stock, -1)}
                                className="px-2 py-0.5 text-xs hover:bg-[#F7E5E9] transition-colors"
                                title="Reducir stock"
                              >
                                -
                              </button>
                              <span className={`px-2.5 py-0.5 font-bold tabular-nums min-w-8 text-center ${
                                isZero ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-[#382A30]'
                              }`}>
                                {prod.stock}
                              </span>
                              <button
                                onClick={() => handleQuickStockChange(prod.id, prod.stock, 1)}
                                className="px-2 py-0.5 text-xs hover:bg-[#F7E5E9] transition-colors"
                                title="Aumentar stock"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isZero ? (
                              <span className="text-red-700 font-semibold text-[11px]">Agotado</span>
                            ) : isLow ? (
                              <span className="text-amber-700 font-semibold text-[11px]">Bajo ({prod.stock})</span>
                            ) : (
                              <span className="text-emerald-700 font-medium text-[11px]">Normal</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 text-[#382A30]/70 hover:text-[#B9788B] hover:bg-[#F7E5E9] rounded-lg transition-colors"
                                title="Editar producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProductClick(prod.id, prod.name)}
                                className="p-1.5 text-[#382A30]/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CONFIGURACIÓN & FIREBASE INTEGRATION */}
        {activeTab === 'configuracion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* BLOQUE: Personalización de Portada (Hero) */}
            <div className="lg:col-span-12 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8BFCB]/70 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F7E5E9] gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#F7E5E9] border border-[#E8BFCB] flex items-center justify-center text-[#B9788B]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif-brand font-semibold text-[#382A30]">
                      Personalización de Portada (Hero)
                    </h3>
                    <p className="text-xs text-[#382A30]/65">
                      Cambia la fotografía principal, títulos, lema y textos de la tienda sin tocar código
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreHeroDefaults}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#E8BFCB] text-[#382A30] hover:bg-[#F7E5E9] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#B9788B]" />
                    <span>Restaurar valores por defecto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="py-1.5 px-4 bg-[#B9788B] hover:bg-[#a6687a] text-white text-xs font-semibold rounded-full transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSettings ? 'Guardando...' : 'Guardar Portada'}</span>
                  </button>
                </div>
              </div>

              {/* Grid with 2 columns: Image manager & Texts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column 1: Image Uploader & Live Preview */}
                <div className="lg:col-span-5 space-y-3.5">
                  <label className="block text-xs font-semibold text-[#382A30]">
                    Fotografía o Banner Principal del Hero
                  </label>

                  {/* Visual Preview */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#E8BFCB]/50 bg-[#F7E5E9]/30 h-52 sm:h-60 flex items-center justify-center group shadow-xs">
                    {settingsForm.heroImageUrl ? (
                      <img
                        src={settingsForm.heroImageUrl}
                        alt="Vista previa portada"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-[#382A30]/50 text-xs">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-[#B9788B]/60" />
                        <span>Sin imagen cargada</span>
                      </div>
                    )}
                    
                    {/* Badge preview overlay */}
                    {settingsForm.heroBadgeText?.trim() !== '.' && (
                      <div
                        className={`absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md rounded-full ${
                          settingsForm.heroBadgeText?.trim() ? 'px-3 py-1 gap-1' : 'p-1.5'
                        } border border-[#E8BFCB] shadow-xs text-[11px] font-medium text-[#382A30] flex items-center`}
                      >
                        <Heart className="w-3 h-3 text-[#B9788B] fill-[#B9788B]" />
                        {settingsForm.heroBadgeText?.trim() ? (
                          <span>{settingsForm.heroBadgeText.trim()}</span>
                        ) : null}
                      </div>
                    )}

                    {isCompressingHeroImage && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#F7E5E9]" />
                        <span>Optimizando imagen con Canvas...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="hero-file-upload"
                        className="flex-1 cursor-pointer py-2 px-3 bg-[#F7E5E9] hover:bg-[#ebd3d9] border border-[#E8BFCB] rounded-xl text-xs font-semibold text-[#382A30] text-center flex items-center justify-center gap-2 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#B9788B]" />
                        <span>Subir desde computador o celular</span>
                      </label>
                      <input
                        id="hero-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleHeroFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[10px] text-[#382A30]/65">
                      ✓ Comprime automáticamente vía Canvas a WebP/JPEG ligero (Base64) para no saturar memoria.
                    </p>

                    <div className="pt-1">
                      <label className="block text-[11px] font-medium text-[#382A30]/75 mb-1">
                        O pegar URL pública de imagen:
                      </label>
                      <input
                        type="url"
                        value={settingsForm.heroImageUrl || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Text Editors */}
                <div className="lg:col-span-7 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-[#382A30] mb-1">
                      Etiqueta Superior (Kicker)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroKicker || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroKicker: e.target.value })
                      }
                      placeholder="✦ BIENVENIDA A TU LUGAR FELIZ"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#382A30]/55 mt-0.5 block">
                      Aparece en la píldora delicada sobre el título principal.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#382A30] mb-1">
                      Título Principal (H1)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroTitle || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                      }
                      placeholder="Brilla a tu manera, nosotros ponemos la magia."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none font-medium"
                    />
                    <span className="text-[10px] text-[#382A30]/55 mt-0.5 block">
                      Las palabras 'ponemos la magia' reciben automáticamente acento de color (#B9788B) e itálica.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#382A30] mb-1">
                      Subtítulo Descriptivo
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.heroSubtitle || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                      }
                      placeholder="Maquillaje y cuidado personal elegido con amor para resaltar lo linda que eres. Arma tu bolsita a tu ritmo y pide fácil por WhatsApp."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#382A30] mb-1">
                        Etiqueta Flotante sobre la Imagen
                      </label>
                      <input
                        type="text"
                        value={settingsForm.heroBadgeText ?? ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroBadgeText: e.target.value })
                        }
                        placeholder="Dejar vacío para solo corazón, o '.' para quitar"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                      />
                      <p className="text-[11px] text-[#382A30]/65 mt-1">
                        Escribe un punto <strong className="text-[#B9788B]">"."</strong> para quitarla por completo, o déjala en blanco para que solo aparezca el corazón.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#382A30] mb-1">
                        Texto del Botón Principal (CTA)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.heroButtonText || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroButtonText: e.target.value })
                        }
                        placeholder="Explorar Catálogo ✦"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Store Settings Form */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8BFCB]/60 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#F7E5E9] pb-4">
                <div>
                  <h3 className="text-base font-serif-brand font-semibold text-[#382A30]">
                    Parámetros de la Tienda
                  </h3>
                  <p className="text-xs text-[#382A30]/60">
                    Control de línea de WhatsApp, tarifas y envíos en Colombia
                  </p>
                </div>
                {settingsSavedMessage && (
                  <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md">
                    ¡Cambios guardados!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#382A30] mb-1">
                    Número de WhatsApp para recibir pedidos (con indicativo de país 57)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-[#382A30]/50 font-medium">
                      +
                    </span>
                    <input
                      type="text"
                      required
                      value={settingsForm.whatsappNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                      }
                      placeholder="573124567890"
                      className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#382A30]/60 mt-1">
                    Este es el número al que el botón "FINALIZAR PEDIDO POR WHATSAPP" enviará el mensaje del cliente.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#382A30] mb-1">
                      Monto mínimo para Envío Gratis ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={settingsForm.freeShippingThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          freeShippingThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#382A30] mb-1">
                      Costo de Envío Estándar ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={settingsForm.standardShippingCost}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          standardShippingCost: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#382A30] mb-1">
                      Instagram Oficial
                    </label>
                    <input
                      type="text"
                      value={settingsForm.instagramHandle}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })
                      }
                      placeholder="@dulzara_bq"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#382A30] mb-1">
                      Ciudad de Despacho
                    </label>
                    <input
                      type="text"
                      value={settingsForm.cityOrigin}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, cityOrigin: e.target.value })
                      }
                      placeholder="Barranquilla Atlántico, Colombia"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="py-2.5 px-6 bg-[#B9788B] hover:bg-[#a6687a] text-white text-xs font-semibold rounded-full transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Guardando...' : 'Guardar Configuración'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetCatalogModal(true)}
                    className="text-xs text-red-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer demo</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Firebase & Cloud Architecture Compliance Card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8BFCB]/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-[#B9788B] font-semibold text-sm">
                <Database className="w-5 h-5" />
                <span>Arquitectura $0 COP & Firebase</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                <strong>Cumplimiento de Presupuesto ($0 COP):</strong>
                <p>
                  El backend actual utiliza la capa de servicio modular con persistencia validada en cliente y sincronización reactiva, sin activar planes de pago (Blaze) ni Google Cloud Billing.
                </p>
              </div>

              <div className="text-xs text-[#382A30]/80 space-y-2">
                <h4 className="font-semibold text-[#382A30]">Esquema Firestore preparado:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li><code>/products/{'{id}'}</code>: Lectura pública sin autenticación, escritura restringida a administradores.</li>
                  <li><code>/orders/{'{id}'}</code>: Creación permitida para clientes sin cuenta; lectura y actualización de estado protegida para administradores.</li>
                  <li><code>/settings/store</code>: Parámetros de la tienda y WhatsApp.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-[#F7E5E9]/50 border border-[#E8BFCB]/50 rounded-2xl text-xs text-[#382A30]/80 space-y-1">
                <span className="font-semibold text-[#382A30] block">Reglas de Seguridad listas:</span>
                <p className="text-[11px] font-mono bg-white p-2 rounded-lg border border-[#E8BFCB]/40 overflow-x-auto">
                  allow read: if true;<br />
                  allow write: if request.auth != null;
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Selected Order Detailed Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8BFCB] z-10 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-[#F7E5E9] bg-[#FFFDF9] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold">
                  Detalle del Pedido
                </span>
                <h3 className="text-lg font-serif-brand font-semibold text-[#382A30]">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#382A30]/50 hover:text-[#382A30] rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Status and Actions */}
              <div className="p-4 rounded-2xl bg-[#F7E5E9]/50 border border-[#E8BFCB]/50 flex items-center justify-between">
                <div>
                  <span className="text-[#382A30]/60 block mb-1">Estado del pedido:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                    }
                    className="py-1.5 px-3 rounded-xl border border-[#E8BFCB] bg-white font-medium text-xs focus:outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="preparando">Preparando</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#382A30] text-[11px] uppercase tracking-wider">
                  Información de Entrega:
                </h4>
                <div className="p-3.5 bg-[#FFFDF9] border border-[#E8BFCB]/50 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#382A30]/60">Destinatario:</span>
                    <strong>{selectedOrder.customer.fullName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#382A30]/60">Teléfono:</span>
                    <a
                      href={`https://wa.me/57${selectedOrder.customer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#25D366] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{selectedOrder.customer.phone} (Abrir WhatsApp)</span>
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#382A30]/60">Ubicación:</span>
                    <span>{selectedOrder.customer.city}, {selectedOrder.customer.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#382A30]/60">Dirección:</span>
                    <span>{selectedOrder.customer.address} (Barrio {selectedOrder.customer.neighborhood})</span>
                  </div>
                  {selectedOrder.customer.notes && (
                    <div className="pt-1.5 border-t border-[#F7E5E9] text-[#382A30]/80 italic">
                      Observaciones: {selectedOrder.customer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#382A30] text-[11px] uppercase tracking-wider">
                  Productos Solicitados:
                </h4>
                <div className="divide-y divide-[#F7E5E9] border border-[#E8BFCB]/40 rounded-xl overflow-hidden bg-white">
                  {selectedOrder.items.map((it) => (
                    <div key={it.productId} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F7E5E9]/40 shrink-0">
                          <BeautyImage
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-[#382A30] block">{it.name}</span>
                          <span className="text-[#382A30]/50 text-[11px]">
                            {it.quantity} unid. × {formatCOP(it.price)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-[#382A30]">
                        {formatCOP(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#E8BFCB]/50 space-y-1">
                <div className="flex justify-between text-[#382A30]/70">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCOP(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#382A30]/70">
                  <span>Envío:</span>
                  <span className="tabular-nums">
                    {selectedOrder.shippingCost === 0 ? 'GRATIS' : formatCOP(selectedOrder.shippingCost)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-[#E8BFCB]/40 flex justify-between font-bold text-sm text-[#382A30]">
                  <span>Total Pedido:</span>
                  <span className="text-[#B9788B] tabular-nums">{formatCOP(selectedOrder.total)}</span>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-[#F7E5E9] bg-[#FFFDF9] flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteOrderClick(selectedOrder.id, selectedOrder.customer.fullName, selectedOrder.total)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl text-xs font-medium border border-red-200 transition-colors"
                title="Eliminar este pedido permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Pedido
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-[#382A30] text-white text-xs font-medium rounded-full hover:bg-[#4a3941]"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8BFCB] z-10 max-h-[92vh] flex flex-col">
            
            <div className="p-5 border-b border-[#F7E5E9] bg-[#FFFDF9] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#B9788B] font-semibold">
                  Gestión de Inventario
                </span>
                <h3 className="text-lg font-serif-brand font-semibold text-[#382A30]">
                  {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-[#382A30]/50 hover:text-[#382A30] rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto p-6 space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-[#382A30] mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="Ej: Suero Hidratante Rosa Mosqueta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        category: e.target.value as Product['category'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] bg-white focus:outline-none"
                  >
                    <option value="Rostro">Rostro</option>
                    <option value="Ojos y Cejas">Ojos y Cejas</option>
                    <option value="Labios">Labios</option>
                    <option value="Skincare y Cuidado">Skincare y Cuidado</option>
                    <option value="Kits y Accesorios">Kits y Accesorios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Existencias en Bodega (Stock) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productFormData.stock}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Precio de Venta ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Precio Original / Antes (Opcional para descuento)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={productFormData.originalPrice || ''}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ej: 55000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#382A30] mb-1">
                  Descripción Corta (Vista en catálogo) *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.shortDescription}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, shortDescription: e.target.value })
                  }
                  placeholder="Una línea concisa sobre el beneficio principal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#382A30] mb-1">
                  Descripción Completa
                </label>
                <textarea
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, description: e.target.value })
                  }
                  placeholder="Detalles sobre la fórmula, textura y beneficios para la piel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#382A30] mb-1">
                  URL de la Fotografía del Producto *
                </label>
                <input
                  type="url"
                  required
                  value={productFormData.imageUrl}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BFCB] focus:border-[#B9788B] focus:outline-none"
                />
                
                {/* Visual Preview */}
                {productFormData.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#F7E5E9]/30 rounded-xl border border-[#E8BFCB]/40">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <BeautyImage
                        src={productFormData.imageUrl}
                        alt="Previsualización"
                        category={productFormData.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-[#382A30]/60">
                      Previsualización de imagen con protección contra enlaces rotos
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Beneficios (uno por línea)
                  </label>
                  <textarea
                    rows={2}
                    value={productFormData.benefits}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, benefits: e.target.value })
                    }
                    placeholder="Hidrata por 24 horas&#10;Acabado satinado"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#382A30] mb-1">
                    Ingredientes Clave
                  </label>
                  <textarea
                    rows={2}
                    value={productFormData.ingredients}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, ingredients: e.target.value })
                    }
                    placeholder="Niacinamida, Ácido Hialurónico, Rosa Mosqueta"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8BFCB] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={productFormData.isFeatured}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isFeatured: e.target.checked })
                  }
                  className="rounded text-[#B9788B] focus:ring-[#B9788B]"
                />
                <label htmlFor="featured-check" className="font-semibold text-[#382A30]">
                  Destacar este producto en la página principal
                </label>
              </div>

              <div className="pt-4 border-t border-[#F7E5E9] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#382A30]/70 hover:text-[#382A30]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#B9788B] hover:bg-[#a6687a] text-white font-medium text-xs rounded-full transition-all shadow-xs"
                >
                  {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Order Deletion */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => !isDeletingOrder && setOrderToDelete(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-base font-bold text-[#382A30]">
                  ¿Eliminar pedido permanentemente?
                </h3>
                <p className="text-xs text-[#382A30]/70 mt-1">
                  Esta acción liberará espacio en la base de datos de Dulzara eliminando los datos del cliente y pedido. No se puede revertir.
                </p>
              </div>

              <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E8BFCB]/50 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#382A30]/60">Referencia:</span>
                  <span className="font-mono font-bold text-[#382A30] bg-[#F7E5E9]/50 px-2 py-0.5 rounded-md">
                    #{orderToDelete.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#382A30]/60">Cliente:</span>
                  <span className="font-semibold text-[#382A30]">{orderToDelete.customerName}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#F7E5E9]">
                  <span className="text-[#382A30]/60">Total:</span>
                  <span className="font-bold text-[#B9788B] tabular-nums">{formatCOP(orderToDelete.total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingOrder}
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#382A30] bg-[#F7E5E9]/60 hover:bg-[#F7E5E9] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingOrder}
                  onClick={handleConfirmDeleteOrder}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Product Deletion */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => !isDeletingProduct && setProductToDelete(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#382A30]">
                  ¿Eliminar producto del catálogo?
                </h3>
                <p className="text-xs text-[#382A30]/70 mt-1">
                  Se eliminará <span className="font-semibold text-[#382A30]">"{productToDelete.name}"</span> de la tienda y del inventario en Firestore.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#382A30] bg-[#F7E5E9]/60 hover:bg-[#F7E5E9] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={handleConfirmDeleteProduct}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar producto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Reset Catalog */}
      {showResetCatalogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => !isResettingCatalog && setShowResetCatalogModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <RotateCcw className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#382A30]">
                  ¿Restablecer catálogo oficial?
                </h3>
                <p className="text-xs text-[#382A30]/70 mt-1">
                  Esta acción restaurará los 10 productos de belleza predeterminados de Dulzara con sus stocks y descripciones iniciales.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isResettingCatalog}
                  onClick={() => setShowResetCatalogModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#382A30] bg-[#F7E5E9]/60 hover:bg-[#F7E5E9] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isResettingCatalog}
                  onClick={handleConfirmResetCatalog}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isResettingCatalog ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restableciendo...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Restablecer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
