import ExpoModulesCore
import WidgetKit

public final class LeoWidgetStorageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LeoWidgetStorage")

    Function("setInt") { (key: String, value: Int, group: String) in
      guard let defaults = UserDefaults(suiteName: group) else { return false }
      defaults.set(value, forKey: key)
      return defaults.synchronize()
    }

    Function("setString") { (key: String, value: String, group: String) in
      guard let defaults = UserDefaults(suiteName: group) else { return false }
      defaults.set(value, forKey: key)
      return defaults.synchronize()
    }

    Function("getString") { (key: String, group: String) -> String? in
      guard let defaults = UserDefaults(suiteName: group),
            let value = defaults.object(forKey: key) else { return nil }
      return String(describing: value)
    }

    Function("remove") { (key: String, group: String) in
      guard let defaults = UserDefaults(suiteName: group) else { return false }
      defaults.removeObject(forKey: key)
      return defaults.synchronize()
    }

    Function("reloadWidget") { (kind: String?) in
      if let kind, !kind.isEmpty {
        WidgetCenter.shared.reloadTimelines(ofKind: kind)
      } else {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}