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
