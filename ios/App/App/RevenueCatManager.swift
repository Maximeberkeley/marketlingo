import Foundation
import RevenueCat

@objc class RevenueCatManager: NSObject {
    
    @objc static let shared = RevenueCatManager()
    
    private override init() {
        super.init()
    }
    
    @objc func configure() {
        Purchases.logLevel = .debug
        Purchases.configure(withAPIKey: "appl_lmFNwybcEwhEaDHaMxtIddKMKyG")
        print("RevenueCat configured with correct API key")
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
                print("No current offering found")
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
        Purchases.shared.getOfferings { offerings, error in
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
    
    @objc func getExpirationDate() -> Date? {
        var expirationDate: Date? = nil
        Purchases.shared.getCustomerInfo { customerInfo, _ in
            expirationDate = customerInfo?.entitlements["MarketLingo Pro"]?.expirationDate
        }
        return expirationDate
    }
    
    @objc func willRenew() -> Bool {
        var willRenew = false
        Purchases.shared.getCustomerInfo { customerInfo, _ in
            willRenew = customerInfo?.entitlements["MarketLingo Pro"]?.willRenew ?? false
        }
        return willRenew
    }
}
