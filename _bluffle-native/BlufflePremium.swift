import Capacitor
import StoreKit

class BluffleViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(BlufflePremium())
    }
}

@objc(BlufflePremium)
public class BlufflePremium: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BlufflePremium"
    public let jsName = "BlufflePremium"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "questions", returnType: CAPPluginReturnPromise)
    ]
    private let productID = "com.bluffle.premium_lifetime"
    private var updatesTask: Task<Void, Never>?
    private var storefrontTask: Task<Void, Never>?
    private var operationInProgress = false

    public override func load() {
        updatesTask = Task { [weak self] in
            for await result in StoreKit.Transaction.updates {
                guard let self = self else { return }
                guard case .verified(let transaction) = result,
                      transaction.productID == self.productID else { continue }
                // Leave the transaction unfinished if its bundled content cannot be delivered.
                if transaction.revocationDate == nil {
                    do { _ = try self.readBank() } catch { continue }
                }
                let owned = await self.hasPremium()
                await MainActor.run {
                    self.notifyListeners("entitlementsChanged", data: ["owned": owned])
                }
                await transaction.finish()
            }
        }
        storefrontTask = Task { [weak self] in
            for await _ in Storefront.updates {
                guard let self = self else { return }
                await MainActor.run { self.notifyListeners("storefrontChanged", data: [:]) }
            }
        }
    }
    deinit { updatesTask?.cancel(); storefrontTask?.cancel() }

    private func hasPremium() async -> Bool {
        for await result in StoreKit.Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == productID,
               transaction.productType == .nonConsumable,
               transaction.revocationDate == nil { return true }
        }
        return false
    }

    private func readBank() throws -> [String: Any] {
        guard let url = Bundle.main.url(forResource: "bluffle-premium-questions", withExtension: "json"),
              let bank = try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any],
              bank["productId"] as? String == productID,
              bank["uniqueCount"] as? Int == 360,
              let kids = bank["kids"] as? [[String]], kids.count == 125,
              let classic = bank["classic"] as? [[String]], classic.count == 254,
              (kids + classic).allSatisfy({ $0.count == 6 && !$0[5].isEmpty }),
              Set(kids.map { $0[5] }).count == 125,
              Set(classic.map { $0[5] }).count == 254,
              Set((kids + classic).map { $0[5] }).count == 360 else {
            throw NSError(domain: "BLUFFLE", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "The Premium questions could not be loaded. Please update the app or contact support."])
        }
        return bank
    }

    private func snapshot(includeProduct: Bool) async -> [String: Any] {
        let owned = await hasPremium()
        var result: [String: Any] = ["owned": owned, "available": false, "price": "", "productId": productID]
        guard includeProduct && !owned else { return result }
        do {
            guard let product = try await Product.products(for: [productID]).first,
                  product.type == .nonConsumable else {
                result["message"] = "Premium is not available from the App Store yet. You can still play Free."
                return result
            }
            // Show Apple's localized price; never substitute a guessed currency or amount.
            result["available"] = true
            result["price"] = product.displayPrice
        } catch {
            result["message"] = "Connect to the App Store to see the price. Your Free game is ready."
        }
        return result
    }

    @objc func status(_ call: CAPPluginCall) {
        let includeProduct = call.getBool("includeProduct") ?? false
        Task { let result = await snapshot(includeProduct: includeProduct); await MainActor.run { call.resolve(result) } }
    }

    @objc func questions(_ call: CAPPluginCall) {
        Task {
            guard await hasPremium() else {
                await MainActor.run { call.reject("An Apple-verified Premium purchase is required.") }; return
            }
            do {
                let bank = try readBank()
                await MainActor.run { call.resolve(bank) }
            } catch {
                await MainActor.run { call.reject(error.localizedDescription) }
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard !operationInProgress else { call.reject("An App Store operation is already in progress."); return }
            operationInProgress = true
            defer { operationInProgress = false }
            do {
                _ = try readBank()
                if await hasPremium() { call.resolve(await snapshot(includeProduct: false)); return }
                guard let product = try await Product.products(for: [productID]).first,
                      product.type == .nonConsumable else {
                    call.reject("Premium is not available from Apple yet."); return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification,
                          transaction.productID == productID,
                          transaction.productType == .nonConsumable,
                          transaction.revocationDate == nil else {
                        call.reject("Apple could not verify this purchase."); return
                    }
                    // Only finish after delivery is possible and ownership is visible to StoreKit.
                    let status = await snapshot(includeProduct: false)
                    guard status["owned"] as? Bool == true else {
                        call.reject("Apple is still confirming your purchase. Please use Restore Purchases shortly."); return
                    }
                    await transaction.finish()
                    call.resolve(status)
                case .userCancelled:
                    var status = await snapshot(includeProduct: true)
                    status["outcome"] = "cancelled"; call.resolve(status)
                case .pending:
                    var status = await snapshot(includeProduct: true)
                    status["outcome"] = "pending"; call.resolve(status)
                @unknown default:
                    call.reject("The purchase could not be confirmed. Please use Restore Purchases.")
                }
            } catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard !operationInProgress else { call.reject("An App Store operation is already in progress."); return }
            operationInProgress = true
            defer { operationInProgress = false }
            do {
                // Only an explicit user tap triggers the account/authentication prompt.
                try await AppStore.sync()
                call.resolve(await snapshot(includeProduct: true))
            } catch { call.reject("Purchases could not be restored. Check your connection and Apple account.") }
        }
    }
}
