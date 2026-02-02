# RevenueCat iOS Setup Guide

## Your RevenueCat Credentials
- **App ID**: `app68880b95cf`
- **Public API Key**: `appl_lmFNwybcEwhEaDHaMxtIddKMKyG`

---

## Step 1: Add RevenueCat SDK to Xcode

1. Open your iOS project in Xcode
2. Go to **File → Add Package Dependencies**
3. Enter this URL: `https://github.com/RevenueCat/purchases-ios.git`
4. Select version **5.0.0** or later
5. Click **Add Package**
6. Make sure **RevenueCat** is added to your app target

---

## Step 2: Create RevenueCatManager.swift

Create a new Swift file in your iOS project at `ios/App/App/RevenueCatManager.swift`:

```swift
import Foundation
import RevenueCat

@objc class RevenueCatManager: NSObject {
    
    @objc static let shared = RevenueCatManager()
    
    private override init() {
        super.init()
    }
    
    @objc func configure() {
        Purchases.logLevel = .debug // Remove in production
        Purchases.configure(withAPIKey: "appl_lmFNwybcEwhEaDHaMxtIddKMKyG")
        print("RevenueCat configured successfully")
    }
    
    @objc func checkSubscriptionStatus(completion: @escaping (Bool) -> Void) {
        Purchases.shared.getCustomerInfo { customerInfo, error in
            if let error = error {
                print("Error fetching customer info: \(error.localizedDescription)")
                completion(false)
                return
            }
            
            let isProUser = customerInfo?.entitlements["MarketLingo Pro"]?.isActive == true
            completion(isProUser)
        }
    }
    
    @objc func getOfferings(completion: @escaping ([String: Any]?) -> Void) {
        Purchases.shared.getOfferings { offerings, error in
            if let error = error {
                print("Error fetching offerings: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let current = offerings?.current else {
                completion(nil)
                return
            }
            
            var result: [String: Any] = [:]
            var packages: [[String: Any]] = []
            
            for package in current.availablePackages {
                packages.append([
                    "identifier": package.identifier,
                    "priceString": package.storeProduct.localizedPriceString,
                    "price": package.storeProduct.price
                ])
            }
            
            result["availablePackages"] = packages
            completion(result)
        }
    }
    
    @objc func purchase(packageIdentifier: String, completion: @escaping (Bool, String?) -> Void) {
        Purchases.shared.getOfferings { [weak self] offerings, error in
            guard let package = offerings?.current?.availablePackages.first(where: { $0.identifier == packageIdentifier }) else {
                completion(false, "Package not found")
                return
            }
            
            Purchases.shared.purchase(package: package) { transaction, customerInfo, error, userCancelled in
                if userCancelled {
                    completion(false, "cancelled")
                    return
                }
                
                if let error = error {
                    completion(false, error.localizedDescription)
                    return
                }
                
                let isProUser = customerInfo?.entitlements["MarketLingo Pro"]?.isActive == true
                completion(isProUser, nil)
            }
        }
    }
    
    @objc func restorePurchases(completion: @escaping (Bool, String?) -> Void) {
        Purchases.shared.restorePurchases { customerInfo, error in
            if let error = error {
                completion(false, error.localizedDescription)
                return
            }
            
            let isProUser = customerInfo?.entitlements["MarketLingo Pro"]?.isActive == true
            completion(isProUser, nil)
        }
    }
}
```

---

## Step 3: Update AppDelegate.swift

Open `ios/App/App/AppDelegate.swift` and add RevenueCat initialization:

```swift
import UIKit
import Capacitor
import RevenueCat  // Add this import

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure RevenueCat
        RevenueCatManager.shared.configure()
        
        return true
    }
    
    // ... rest of your AppDelegate code
}
```

---

## Step 4: Create Capacitor Plugin (Optional - for JS bridge)

If you want to call RevenueCat from your web code, create a Capacitor plugin.

Create `ios/App/App/RevenueCatPlugin.swift`:

```swift
import Foundation
import Capacitor

@objc(RevenueCatPlugin)
public class RevenueCatPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RevenueCatPlugin"
    public let jsName = "RevenueCat"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getOfferings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCustomerInfo", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func getOfferings(_ call: CAPPluginCall) {
        RevenueCatManager.shared.getOfferings { offerings in
            if let offerings = offerings {
                call.resolve(offerings)
            } else {
                call.reject("Failed to get offerings")
            }
        }
    }
    
    @objc func purchase(_ call: CAPPluginCall) {
        guard let packageId = call.getString("packageIdentifier") else {
            call.reject("Package identifier required")
            return
        }
        
        RevenueCatManager.shared.purchase(packageIdentifier: packageId) { success, error in
            if success {
                call.resolve(["success": true])
            } else if error == "cancelled" {
                call.resolve(["success": false, "cancelled": true])
            } else {
                call.reject(error ?? "Purchase failed")
            }
        }
    }
    
    @objc func restorePurchases(_ call: CAPPluginCall) {
        RevenueCatManager.shared.restorePurchases { success, error in
            if success {
                call.resolve(["success": true, "restored": true])
            } else {
                call.resolve(["success": true, "restored": false])
            }
        }
    }
    
    @objc func getCustomerInfo(_ call: CAPPluginCall) {
        RevenueCatManager.shared.checkSubscriptionStatus { isProUser in
            call.resolve(["isProUser": isProUser])
        }
    }
}
```

---

## Step 5: Register Plugin in Bridge

Add the plugin to `ios/App/App/capacitor.config.json` or register it in the bridge.

---

## App Store Connect Setup

Make sure you have these products configured in App Store Connect:

| Product ID | Type | Price |
|------------|------|-------|
| `MarketLingo.pro.monthly` | Auto-Renewable Subscription | $9.99/month |
| `MarketLingo.pro.yearly` | Auto-Renewable Subscription | $79.99/year |

---

## RevenueCat Dashboard Setup

1. Go to RevenueCat Dashboard → Your App
2. Under **Products**, add your App Store product IDs
3. Under **Entitlements**, create `MarketLingo Pro`
4. Under **Offerings**, create a default offering with your packages:
   - `monthly` → MarketLingo.pro.monthly
   - `annual` → MarketLingo.pro.yearly

---

## Troubleshooting

### "Wrong API Key" Error
- Make sure you're using `appl_lmFNwybcEwhEaDHaMxtIddKMKyG`
- Verify the API key is for the correct app in RevenueCat dashboard

### Products Not Loading
- Products must be approved in App Store Connect
- Sandbox account must be signed in on device
- Check RevenueCat dashboard for product sync status

### Build Errors
- Clean build folder: `Cmd + Shift + K`
- Delete DerivedData: `~/Library/Developer/Xcode/DerivedData`
- Re-run `npx cap sync ios`
