import Footer from './components/layout/Footer';
import { useAuth } from './context/AuthContext';
import { ticketSyncService } from './services/ticketSyncService';
import React from 'react';
import Navbar from './components/layout/Navbar';
import AmbientGlowCanvas from './components/common/AmbientGlowCanvas';
import HeroBanner from './components/home/HeroBanner';
import GameFilterTabs from './components/home/GameFilterTabs';
import SearchBar from './components/home/SearchBar';
import ProductGrid from './components/products/ProductGrid';
import ProductModal from './components/products/ProductModal';
import CartDrawer from './components/cart/CartDrawer';
import CartNotificationToast from './components/cart/CartNotificationToast';
import FloatingCartButton from './components/cart/FloatingCartButton';
import CheckoutModal from './components/checkout/CheckoutModal';
import OrderTrackingModal from './components/orders/OrderTrackingModal';
import CustomerOrdersModal from './components/orders/CustomerOrdersModal';
import OngoingOrderWidget from './components/orders/OngoingOrderWidget';
import PhotoProofReceipt from './components/orders/PhotoProofReceipt';
import ProofsModal from './components/modals/ProofsModal';
import StatusModal from './components/modals/StatusModal';
import TutorialModal from './components/modals/TutorialModal';
import SupportModal from './components/modals/SupportModal';
import AffiliateModal from './components/modals/AffiliateModal';
import AuthModal from './components/auth/AuthModal';
import StaffPortalModal from './components/staff/StaffPortalModal';
import AdminStaffModal from './components/staff/AdminStaffModal';
import AdminLiveBar from './components/admin/AdminLiveBar';
import ProductEditorModal from './components/admin/ProductEditorModal';
import GameEditorModal from './components/admin/GameEditorModal';
import CustomerReviews from './components/home/CustomerReviews';
import LivePurchaseTicker from './components/features/LivePurchaseTicker';
import { useStore } from './context/StoreContext';
import { DialogProvider } from './context/DialogContext';
import CustomDialogModal from './components/common/CustomDialogModal';

export default function App() {
  const {
    selectedReceiptOrder,
    closeReceiptModal,
    setActiveOrder,
    setIsOrderTrackingOpen
  } = useStore();
  const { currentUser, openStaffPortal } = useAuth();

  // Listen to ?ticket= and ?order= query params from Discord link
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket') || params.get('order');
      if (ticketParam) {
        // Auto-switch to staff view or open ticket
        if (currentUser?.role === 'staff' || currentUser?.role === 'admin') {
          openStaffPortal(ticketParam);
        } else {
          // Check if ticket exists in local store
          const localTicket = ticketSyncService.getTicketById(ticketParam);
          if (localTicket) {
            setActiveOrder({
              id: localTicket.orderId || localTicket.id,
              orderNumber: localTicket.orderId || localTicket.id,
              robloxUser: localTicket.buyer,
              buyerUsername: localTicket.buyer?.robloxUsername,
              items: localTicket.items,
              total: localTicket.total,
              pinCode: localTicket.pinCode,
              verificationPin: localTicket.pinCode,
              paymentMethod: localTicket.paymentMethod,
              status: localTicket.status
            });
            setIsOrderTrackingOpen(true);
          } else {
            // Fetch from backend
            const token = localStorage.getItem('grandstock_jwt_token_v2');
            fetch('/api/tickets/list', {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })
              .then(r => r.json())
              .then(data => {
                const found = (data.tickets || []).find(t => t.id === ticketParam || t.orderId === ticketParam);
                if (found) {
                  setActiveOrder({
                    id: found.orderId || found.id,
                    orderNumber: found.orderId || found.id,
                    robloxUser: found.buyer,
                    buyerUsername: found.buyer?.robloxUsername,
                    items: found.items,
                    total: found.total,
                    pinCode: found.pinCode,
                    verificationPin: found.pinCode,
                    paymentMethod: found.paymentMethod,
                    status: found.status
                  });
                  setIsOrderTrackingOpen(true);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (e) {}
  }, [currentUser, openStaffPortal, setActiveOrder, setIsOrderTrackingOpen]);

  return (
    <DialogProvider>
    <div className="min-h-screen bg-gs-dark text-gs-light font-sans relative overflow-x-hidden selection:bg-gs-primary selection:text-white">
      {/* Site Owner / Admin In-Place CMS Toolbar */}
      <AmbientGlowCanvas />
      <AdminLiveBar />

      {/* Main Navbar */}
      <Navbar />

      {/* Main Storefront Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <HeroBanner />
        {/* 100% Verified Customer Vouches & Social Proof - Placed Prominently Before Catalog */}
        <CustomerReviews />
        <SearchBar />
        <GameFilterTabs />
        <ProductGrid />
      </main>

      {/* Global High-Tech Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <ProductModal />
      <CartDrawer />
      <CartNotificationToast />
      <FloatingCartButton />
      <CheckoutModal />
      <OrderTrackingModal />
      <CustomerOrdersModal />
      <OngoingOrderWidget />
      <ProofsModal />
      <StatusModal />
      <TutorialModal />
      <SupportModal />
      <AffiliateModal />
      <AuthModal />
      <StaffPortalModal />
      <AdminStaffModal />

      {/* Admin In-Place CMS Modals */}
      <ProductEditorModal />
      <GameEditorModal />

      {/* Receipt modal */}
      {selectedReceiptOrder && (
        <PhotoProofReceipt
          order={selectedReceiptOrder}
          onClose={closeReceiptModal}
        />
      )}

      {/* Floating Ticker */}
      <LivePurchaseTicker />

      {/* Global Custom Styled Dialog Modal */}
      <CustomDialogModal />
    </div>
    </DialogProvider>
  );
}
