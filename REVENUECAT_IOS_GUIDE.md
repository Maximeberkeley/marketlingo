# RevenueCat iOS Integration Guide for MarketLingo

Complete guide for integrating RevenueCat subscriptions with Swift Package Manager, SwiftUI Paywalls, and Customer Center.

## Table of Contents
1. [Swift Package Installation](#1-swift-package-installation)
2. [Project Configuration](#2-project-configuration)
3. [RevenueCat Setup](#3-revenuecat-setup)
4. [SwiftUI Implementation](#4-swiftui-implementation)
5. [Paywall Integration](#5-paywall-integration)
6. [Customer Center](#6-customer-center)
7. [Best Practices](#7-best-practices)

---

## 1. Swift Package Installation

### Step 1: Open Xcode Project
```bash
# First, sync your Capacitor project
npm run build
npx cap sync ios
npx cap open ios
```

### Step 2: Add RevenueCat Package
1. In Xcode, go to **File → Add Package Dependencies...**
2. Enter the repository URL:
   ```
   https://github.com/RevenueCat/purchases-ios-spm.git
   ```
3. For "Dependency Rule", select **Up to Next Major Version** with `5.0.0`
4. Click **Add Package**
5. Select these libraries to add:
   - ✅ `RevenueCat` (required)
   - ✅ `RevenueCatUI` (for Paywalls)
   - ✅ `ReceiptParser` (optional, for debugging)

### Step 3: Add StoreKit Configuration (for testing)
1. **File → New → File → StoreKit Configuration File**
2. Name it `MarketLingo.storekit`
3. Add your products:
   - `marketlingo_pro_monthly` - $9.99/month
   - `marketlingo_pro_annual` - $79.99/year  
   - `marketlingo_pro_lifetime` - $199.99 one-time

---

## 2. Project Configuration

### Enable In-App Purchase Capability
1. Select your project in Xcode
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **In-App Purchase**

### Info.plist (if needed)
No additional Info.plist entries required for RevenueCat.

---

## 3. RevenueCat Setup

### Create RevenueCatManager.swift

Create a new Swift file in your iOS project: `App/RevenueCatManager.swift`

```swift
import Foundation
import RevenueCat
import Combine

/// Centralized manager for RevenueCat subscriptions
@MainActor
final class RevenueCatManager: ObservableObject {
    
    // MARK: - Singleton
    static let shared = RevenueCatManager()
    
    // MARK: - Published Properties
    @Published private(set) var customerInfo: CustomerInfo?
    @Published private(set) var offerings: Offerings?
    @Published private(set) var isProUser: Bool = false
    @Published private(set) var isLoading: Bool = true
    @Published private(set) var error: String?
    
    // MARK: - Constants
    private let apiKey = "test_mGwqlvGwZYUnyBsIYtCcWDYcLbS"
    private let proEntitlementID = "MarketLingo Pro"
    
    // Product Identifiers
    enum ProductID: String, CaseIterable {
        case monthly = "marketlingo_pro_monthly"
        case annual = "marketlingo_pro_annual"
        case lifetime = "marketlingo_pro_lifetime"
        
        var displayName: String {
            switch self {
            case .monthly: return "Monthly"
            case .annual: return "Yearly"
            case .lifetime: return "Lifetime"
            }
        }
    }
    
    // MARK: - Initialization
    private init() {}
    
    // MARK: - Configuration
    
    /// Configure RevenueCat - call this in AppDelegate or App init
    func configure() {
        // Enable debug logs in development
        #if DEBUG
        Purchases.logLevel = .debug
        #else
        Purchases.logLevel = .warn
        #endif
        
        // Configure with API key
        Purchases.configure(withAPIKey: apiKey)
        
        // Set delegate for real-time updates
        Purchases.shared.delegate = self
        
        // Initial fetch
        Task {
            await fetchCustomerInfo()
            await fetchOfferings()
        }
    }
    
    /// Configure with user ID for logged-in users
    func configureWithUser(userID: String) async {
        do {
            let (customerInfo, _) = try await Purchases.shared.logIn(userID)
            self.customerInfo = customerInfo
            self.updateProStatus()
        } catch {
            self.error = "Failed to log in: \(error.localizedDescription)"
        }
    }
    
    /// Log out user
    func logout() async {
        do {
            let customerInfo = try await Purchases.shared.logOut()
            self.customerInfo = customerInfo
            self.updateProStatus()
        } catch {
            self.error = "Failed to log out: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Fetch Data
    
    /// Fetch current customer info
    func fetchCustomerInfo() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            customerInfo = try await Purchases.shared.customerInfo()
            updateProStatus()
            error = nil
        } catch {
            self.error = "Failed to fetch customer info: \(error.localizedDescription)"
        }
    }
    
    /// Fetch available offerings
    func fetchOfferings() async {
        do {
            offerings = try await Purchases.shared.offerings()
            error = nil
        } catch {
            self.error = "Failed to fetch offerings: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Entitlement Checking
    
    /// Check if user has Pro entitlement
    private func updateProStatus() {
        isProUser = customerInfo?.entitlements[proEntitlementID]?.isActive == true
    }
    
    /// Check specific entitlement
    func hasEntitlement(_ identifier: String) -> Bool {
        return customerInfo?.entitlements[identifier]?.isActive == true
    }
    
    /// Get expiration date for Pro subscription
    var proExpirationDate: Date? {
        customerInfo?.entitlements[proEntitlementID]?.expirationDate
    }
    
    /// Check if subscription will renew
    var willRenew: Bool {
        customerInfo?.entitlements[proEntitlementID]?.willRenew == true
    }
    
    // MARK: - Purchases
    
    /// Purchase a package
    func purchase(package: Package) async throws -> CustomerInfo {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let result = try await Purchases.shared.purchase(package: package)
            
            if !result.userCancelled {
                self.customerInfo = result.customerInfo
                updateProStatus()
            }
            
            return result.customerInfo
        } catch {
            self.error = "Purchase failed: \(error.localizedDescription)"
            throw error
        }
    }
    
    /// Purchase by product ID
    func purchase(productID: ProductID) async throws -> CustomerInfo {
        guard let offerings = offerings,
              let current = offerings.current,
              let package = current.availablePackages.first(where: { 
                  $0.storeProduct.productIdentifier == productID.rawValue 
              }) else {
            throw PurchaseError.productNotFound
        }
        
        return try await purchase(package: package)
    }
    
    /// Restore purchases
    func restorePurchases() async throws -> CustomerInfo {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let customerInfo = try await Purchases.shared.restorePurchases()
            self.customerInfo = customerInfo
            updateProStatus()
            return customerInfo
        } catch {
            self.error = "Restore failed: \(error.localizedDescription)"
            throw error
        }
    }
    
    // MARK: - Helpers
    
    /// Get current offering
    var currentOffering: Offering? {
        offerings?.current
    }
    
    /// Get all available packages
    var availablePackages: [Package] {
        currentOffering?.availablePackages ?? []
    }
    
    /// Get monthly package
    var monthlyPackage: Package? {
        currentOffering?.monthly
    }
    
    /// Get annual package
    var annualPackage: Package? {
        currentOffering?.annual
    }
    
    /// Get lifetime package
    var lifetimePackage: Package? {
        currentOffering?.lifetime
    }
}

// MARK: - PurchasesDelegate

extension RevenueCatManager: PurchasesDelegate {
    nonisolated func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            self.customerInfo = customerInfo
            self.updateProStatus()
        }
    }
}

// MARK: - Errors

enum PurchaseError: LocalizedError {
    case productNotFound
    case purchaseFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .productNotFound:
            return "Product not found in current offerings"
        case .purchaseFailed(let message):
            return "Purchase failed: \(message)"
        }
    }
}
```

---

## 4. SwiftUI Implementation

### App Entry Point Configuration

Update your `App.swift` or `AppDelegate.swift`:

```swift
import SwiftUI
import RevenueCat

@main
struct MarketLingoApp: App {
    
    init() {
        // Configure RevenueCat on app launch
        RevenueCatManager.shared.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(RevenueCatManager.shared)
        }
    }
}
```

### Subscription Status View

Create `SubscriptionStatusView.swift`:

```swift
import SwiftUI
import RevenueCat

struct SubscriptionStatusView: View {
    @EnvironmentObject var rcManager: RevenueCatManager
    
    var body: some View {
        VStack(spacing: 16) {
            // Status Badge
            HStack {
                Image(systemName: rcManager.isProUser ? "crown.fill" : "lock.fill")
                    .foregroundColor(rcManager.isProUser ? .yellow : .gray)
                
                Text(rcManager.isProUser ? "Pro Member" : "Free Account")
                    .font(.headline)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(rcManager.isProUser ? Color.yellow.opacity(0.2) : Color.gray.opacity(0.2))
            )
            
            // Expiration info
            if rcManager.isProUser, let expirationDate = rcManager.proExpirationDate {
                VStack(spacing: 4) {
                    Text("Subscription expires:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(expirationDate, style: .date)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if rcManager.willRenew {
                        Label("Auto-renew enabled", systemImage: "arrow.triangle.2.circlepath")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            
            // Error display
            if let error = rcManager.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding()
            }
        }
    }
}
```

### Custom Subscription Page

Create `SubscriptionView.swift`:

```swift
import SwiftUI
import RevenueCat

struct SubscriptionView: View {
    @EnvironmentObject var rcManager: RevenueCatManager
    @State private var selectedPackage: Package?
    @State private var isPurchasing = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Benefits
                    benefitsSection
                    
                    // Packages
                    if rcManager.isLoading {
                        ProgressView("Loading...")
                            .padding()
                    } else {
                        packagesSection
                    }
                    
                    // Restore Button
                    restoreButton
                    
                    // Terms
                    termsSection
                }
                .padding()
            }
            .navigationTitle("Go Pro")
            .navigationBarTitleDisplayMode(.large)
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Sections
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "crown.fill")
                .font(.system(size: 60))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.yellow, .orange],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text("Unlock MarketLingo Pro")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Master deep-tech markets with unlimited access")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top)
    }
    
    private var benefitsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            BenefitRow(icon: "infinity", title: "Unlimited Lessons", subtitle: "No daily limits")
            BenefitRow(icon: "chart.line.uptrend.xyaxis", title: "Investment Lab", subtitle: "Expert scenarios & certification")
            BenefitRow(icon: "brain.head.profile", title: "AI Mentor", subtitle: "Unlimited conversations")
            BenefitRow(icon: "sparkles", title: "Premium Content", subtitle: "Exclusive insights")
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
        )
    }
    
    private var packagesSection: some View {
        VStack(spacing: 12) {
            ForEach(rcManager.availablePackages, id: \.identifier) { package in
                PackageCard(
                    package: package,
                    isSelected: selectedPackage?.identifier == package.identifier,
                    onSelect: { selectedPackage = package }
                )
            }
            
            // Purchase Button
            Button(action: purchaseSelected) {
                HStack {
                    if isPurchasing {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "crown.fill")
                        Text("Subscribe Now")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    LinearGradient(
                        colors: [.purple, .pink],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .disabled(selectedPackage == nil || isPurchasing)
            .opacity(selectedPackage == nil ? 0.6 : 1)
        }
    }
    
    private var restoreButton: some View {
        Button(action: restorePurchases) {
            Text("Restore Purchases")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var termsSection: some View {
        VStack(spacing: 8) {
            Text("Subscription auto-renews unless cancelled 24 hours before the end of the current period.")
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 16) {
                Link("Terms of Use", destination: URL(string: "https://your-terms-url.com")!)
                Link("Privacy Policy", destination: URL(string: "https://your-privacy-url.com")!)
            }
            .font(.caption)
        }
        .padding(.top)
    }
    
    // MARK: - Actions
    
    private func purchaseSelected() {
        guard let package = selectedPackage else { return }
        
        isPurchasing = true
        
        Task {
            do {
                _ = try await rcManager.purchase(package: package)
                // Success - view will update via @Published
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isPurchasing = false
        }
    }
    
    private func restorePurchases() {
        isPurchasing = true
        
        Task {
            do {
                let info = try await rcManager.restorePurchases()
                if !rcManager.isProUser {
                    errorMessage = "No active subscriptions found"
                    showError = true
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isPurchasing = false
        }
    }
}

// MARK: - Supporting Views

struct BenefitRow: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.purple)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
        }
    }
}

struct PackageCard: View {
    let package: Package
    let isSelected: Bool
    let onSelect: () -> Void
    
    private var savingsText: String? {
        switch package.packageType {
        case .annual:
            return "Save 33%"
        case .lifetime:
            return "Best Value"
        default:
            return nil
        }
    }
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(package.storeProduct.localizedTitle)
                            .font(.headline)
                        
                        if let savings = savingsText {
                            Text(savings)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(4)
                        }
                    }
                    
                    Text(package.storeProduct.localizedDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(package.storeProduct.localizedPriceString)
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    if package.packageType == .annual {
                        Text(perMonthPrice)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.purple : Color.gray.opacity(0.3), lineWidth: isSelected ? 2 : 1)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSelected ? Color.purple.opacity(0.1) : Color.clear)
                    )
            )
        }
        .buttonStyle(.plain)
    }
    
    private var perMonthPrice: String {
        let monthlyPrice = package.storeProduct.price / 12
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = package.storeProduct.priceLocale
        return "\(formatter.string(from: monthlyPrice as NSNumber) ?? "")/mo"
    }
}
```

---

## 5. Paywall Integration

### Using RevenueCatUI Paywalls

RevenueCat provides pre-built, customizable paywalls. First, configure your paywall in the RevenueCat Dashboard, then use it in code:

```swift
import SwiftUI
import RevenueCatUI

struct PaywallContainerView: View {
    @State private var showPaywall = false
    @EnvironmentObject var rcManager: RevenueCatManager
    
    var body: some View {
        VStack {
            // Your content
            
            if !rcManager.isProUser {
                Button("Upgrade to Pro") {
                    showPaywall = true
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .presentPaywallIfNeeded(
            requiredEntitlementIdentifier: "MarketLingo Pro",
            purchaseCompleted: { customerInfo in
                print("Purchase completed: \(customerInfo.entitlements)")
            },
            restoreCompleted: { customerInfo in
                print("Restore completed: \(customerInfo.entitlements)")
            }
        )
    }
}

// Alternative: Manual presentation
struct ManualPaywallView: View {
    @State private var showPaywall = false
    
    var body: some View {
        Button("Show Paywall") {
            showPaywall = true
        }
        .sheet(isPresented: $showPaywall) {
            PaywallView()
                .onPurchaseCompleted { customerInfo in
                    print("Purchase completed!")
                    showPaywall = false
                }
                .onRestoreCompleted { customerInfo in
                    print("Restore completed!")
                    showPaywall = false
                }
        }
    }
}

// With custom offering
struct CustomOfferingPaywall: View {
    @EnvironmentObject var rcManager: RevenueCatManager
    @State private var showPaywall = false
    
    var body: some View {
        Button("Upgrade") {
            showPaywall = true
        }
        .sheet(isPresented: $showPaywall) {
            if let offering = rcManager.currentOffering {
                PaywallView(offering: offering, displayCloseButton: true)
            }
        }
    }
}
```

### Paywall Footer (Compact Mode)

For inline subscription options:

```swift
import RevenueCatUI

struct FeatureLockedView: View {
    @EnvironmentObject var rcManager: RevenueCatManager
    
    var body: some View {
        VStack {
            // Your locked content preview
            Image(systemName: "lock.fill")
                .font(.largeTitle)
            
            Text("This feature requires Pro")
                .font(.headline)
            
            // Compact paywall footer
            if let offering = rcManager.currentOffering {
                PaywallFooterView(
                    offering: offering,
                    condensed: true,
                    purchaseCompleted: { _ in },
                    restoreCompleted: { _ in }
                )
            }
        }
    }
}
```

---

## 6. Customer Center

Customer Center provides subscription management UI for users.

### Setup Customer Center

```swift
import SwiftUI
import RevenueCat
import RevenueCatUI

struct SettingsView: View {
    @State private var showCustomerCenter = false
    @EnvironmentObject var rcManager: RevenueCatManager
    
    var body: some View {
        List {
            Section("Account") {
                // Subscription Status
                HStack {
                    Text("Subscription")
                    Spacer()
                    Text(rcManager.isProUser ? "Pro" : "Free")
                        .foregroundColor(.secondary)
                }
                
                // Customer Center Button
                Button(action: { showCustomerCenter = true }) {
                    HStack {
                        Text("Manage Subscription")
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .presentCustomerCenter(isPresented: $showCustomerCenter) {
            // Customer center was dismissed
        }
    }
}

// Alternative: Inline presentation
struct InlineCustomerCenter: View {
    var body: some View {
        CustomerCenterView()
    }
}

// With custom handling
struct CustomCustomerCenter: View {
    @State private var showCenter = false
    
    var body: some View {
        Button("Subscription Settings") {
            showCenter = true
        }
        .sheet(isPresented: $showCenter) {
            CustomerCenterView()
                .onCustomerCenterDismiss {
                    showCenter = false
                }
        }
    }
}
```

---

## 7. Best Practices

### Feature Gating

Create a reusable feature gate modifier:

```swift
import SwiftUI

struct ProFeatureModifier: ViewModifier {
    @EnvironmentObject var rcManager: RevenueCatManager
    @State private var showPaywall = false
    let lockedMessage: String
    
    func body(content: Content) -> some View {
        Group {
            if rcManager.isProUser {
                content
            } else {
                // Locked state
                VStack(spacing: 16) {
                    Image(systemName: "lock.fill")
                        .font(.largeTitle)
                        .foregroundColor(.secondary)
                    
                    Text(lockedMessage)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                    
                    Button("Unlock with Pro") {
                        showPaywall = true
                    }
                    .buttonStyle(.borderedProminent)
                }
                .sheet(isPresented: $showPaywall) {
                    PaywallView()
                }
            }
        }
    }
}

extension View {
    func requiresPro(message: String = "This feature requires Pro") -> some View {
        modifier(ProFeatureModifier(lockedMessage: message))
    }
}

// Usage
struct InvestmentLabView: View {
    var body: some View {
        VStack {
            Text("Investment Lab Content")
        }
        .requiresPro(message: "Investment Lab requires a Pro subscription")
    }
}
```

### Error Handling

```swift
extension RevenueCatManager {
    func handlePurchaseError(_ error: Error) -> String {
        if let purchasesError = error as? RevenueCat.ErrorCode {
            switch purchasesError {
            case .purchaseCancelledError:
                return "Purchase was cancelled"
            case .purchaseNotAllowedError:
                return "Purchases not allowed on this device"
            case .purchaseInvalidError:
                return "Invalid purchase"
            case .productNotAvailableForPurchaseError:
                return "Product not available"
            case .networkError:
                return "Network error. Please check your connection."
            case .receiptAlreadyInUseError:
                return "Receipt already in use by another account"
            default:
                return "Purchase failed: \(purchasesError.localizedDescription)"
            }
        }
        return error.localizedDescription
    }
}
```

### Analytics Integration

```swift
// Track subscription events
extension RevenueCatManager {
    func trackPurchaseEvent(package: Package, success: Bool) {
        // Integrate with your analytics
        let event: [String: Any] = [
            "product_id": package.storeProduct.productIdentifier,
            "price": package.storeProduct.price,
            "currency": package.storeProduct.priceLocale.currency?.identifier ?? "USD",
            "success": success
        ]
        
        // Example: Firebase Analytics
        // Analytics.logEvent("subscription_purchase", parameters: event)
    }
}
```

### Debugging

```swift
#if DEBUG
extension RevenueCatManager {
    /// Debug helper to print current state
    func debugPrintState() {
        print("====== RevenueCat Debug ======")
        print("Is Pro: \(isProUser)")
        print("Customer ID: \(customerInfo?.originalAppUserId ?? "none")")
        print("Active Entitlements: \(customerInfo?.entitlements.active.keys.joined(separator: ", ") ?? "none")")
        print("Offerings: \(offerings?.current?.identifier ?? "none")")
        print("Available Packages: \(availablePackages.map { $0.identifier })")
        print("==============================")
    }
}
#endif
```

---

## App Store Connect Product Setup

### 1. Create Products in App Store Connect

1. Go to **App Store Connect → Your App → Features → In-App Purchases**
2. Click **+** to add new products:

| Reference Name | Product ID | Type | Price |
|---------------|------------|------|-------|
| Pro Monthly | marketlingo_pro_monthly | Auto-Renewable | $9.99 |
| Pro Yearly | marketlingo_pro_annual | Auto-Renewable | $79.99 |
| Pro Lifetime | marketlingo_pro_lifetime | Non-Consumable | $199.99 |

### 2. Configure in RevenueCat Dashboard

1. Go to **RevenueCat Dashboard → Products**
2. Import products from App Store Connect
3. Create **Entitlements**:
   - Name: `MarketLingo Pro`
   - Attach all 3 products
4. Create **Offerings**:
   - Default offering with all packages
   - Configure paywall if using RevenueCatUI

---

## Checklist

- [ ] Added Swift Package: `https://github.com/RevenueCat/purchases-ios-spm.git`
- [ ] Added RevenueCat and RevenueCatUI libraries
- [ ] Enabled In-App Purchase capability
- [ ] Created RevenueCatManager.swift
- [ ] Configured in App/AppDelegate
- [ ] Created subscription views
- [ ] Implemented paywall
- [ ] Added Customer Center to settings
- [ ] Created products in App Store Connect
- [ ] Configured entitlements in RevenueCat
- [ ] Tested with StoreKit Configuration file
- [ ] Tested restore purchases
- [ ] Added error handling

---

## Testing

### Sandbox Testing
1. Create a Sandbox Tester in App Store Connect
2. Sign out of App Store on device
3. When prompted during purchase, use sandbox credentials
4. Subscriptions renew quickly in sandbox (monthly = 5 min)

### StoreKit Testing (Xcode)
1. Create StoreKit Configuration file
2. Edit scheme → Run → Options → StoreKit Configuration
3. Test purchases without sandbox account
