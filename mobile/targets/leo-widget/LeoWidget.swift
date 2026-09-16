import SwiftUI
import WidgetKit

private let appGroup = "group.app.marketlingo.aerospace.shared"
private let widgetKind = "LeoWidget"

struct LeoEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let lessonComplete: Bool
    let expiresAt: Date
    let market: String
}

struct LeoProvider: TimelineProvider {
    func placeholder(in context: Context) -> LeoEntry {
        LeoEntry(date: Date(), streak: 12, lessonComplete: false, expiresAt: Calendar.current.date(byAdding: .hour, value: 3, to: Date()) ?? Date(), market: "YOUR MARKET")
    }

    func getSnapshot(in context: Context, completion: @escaping (LeoEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LeoEntry>) -> Void) {
        let entry = loadEntry()
        let refresh = min(entry.expiresAt, Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? entry.expiresAt)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }

    private func loadEntry() -> LeoEntry {
        let store = UserDefaults(suiteName: appGroup)
        let expirySeconds = store?.double(forKey: "leo_widget_expires_at") ?? 0
        let defaultExpiry = Calendar.current.date(bySettingHour: 23, minute: 59, second: 59, of: Date()) ?? Date()
        return LeoEntry(
            date: Date(),
            streak: store?.integer(forKey: "leo_widget_streak") ?? 0,
            lessonComplete: store?.bool(forKey: "leo_widget_complete") ?? false,
            expiresAt: expirySeconds > 0 ? Date(timeIntervalSince1970: expirySeconds) : defaultExpiry,
            market: store?.string(forKey: "leo_widget_market")?.uppercased() ?? "YOUR MARKET"
        )
    }
}

private struct LeoMood {
    let image: String
    let headline: String
    let line: String
    let top: Color
    let bottom: Color
}

private func mood(for entry: LeoEntry) -> LeoMood {
    let hour = Calendar.current.component(.hour, from: entry.date)
    let remaining = entry.expiresAt.timeIntervalSince(entry.date)
    let seed = max(entry.streak, Calendar.current.component(.day, from: entry.date))

    if entry.lessonComplete {
        let lines = [
            "Fine. You may be proud of yourself.",
            "Streak secured. I had doubts. Many doubts.",
            "You showed up. Suspiciously competent."
        ]
        return LeoMood(image: "leoSly", headline: "DONE. FOR NOW.", line: lines[seed % lines.count], top: Color(red: 0.05, green: 0.65, blue: 0.45), bottom: Color(red: 0.02, green: 0.43, blue: 0.32))
    }

    if remaining <= 2 * 60 * 60 {
        let lines = [
            "Your streak is dying. Very on-brand.",
            "I saved the panic for both of us.",
            "Move. The clock has no sympathy."
        ]
        return LeoMood(image: "leoWorried", headline: "LAST CHANCE", line: lines[seed % lines.count], top: Color(red: 0.94, green: 0.20, blue: 0.20), bottom: Color(red: 0.69, green: 0.05, blue: 0.14))
    }

    if hour >= 20 {
        let lines = [
            "I believed in you. Weird choice, apparently.",
            "Your streak asked me to find a new owner.",
            "Still nothing? Bold retention strategy."
        ]
        return LeoMood(image: "leoPleading", headline: "DON'T DO THIS", line: lines[seed % lines.count], top: Color(red: 0.98, green: 0.36, blue: 0.12), bottom: Color(red: 0.82, green: 0.13, blue: 0.10))
    }

    if hour < 10 {
        let lines = [
            "Your industry woke up. Eventually, you will too.",
            "Five minutes. Even half-awake you can manage.",
            "I speak, breathe, eat and sleep markets. You still have to."
        ]
        return LeoMood(image: "leoSleepy", headline: "RISE & GRIND", line: lines[seed % lines.count], top: Color(red: 0.96, green: 0.62, blue: 0.08), bottom: Color(red: 0.91, green: 0.31, blue: 0.05))
    }

    let lines = [
        "I cleared my schedule. You had better have one.",
        "The market moved. You watched it move without you.",
        "No pressure. Just your entire competitive advantage."
    ]
    return LeoMood(image: "leoStern", headline: "LESSON. NOW.", line: lines[seed % lines.count], top: Color(red: 0.98, green: 0.39, blue: 0.08), bottom: Color(red: 0.86, green: 0.16, blue: 0.08))
}

struct LeoWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LeoEntry

    var body: some View {
        let state = mood(for: entry)
        ZStack {
            LinearGradient(colors: [state.top, state.bottom], startPoint: .topLeading, endPoint: .bottomTrailing)

            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: family == .systemSmall ? 5 : 8) {
                    HStack(spacing: 5) {
                        Image(systemName: "flame.fill")
                        Text("\(entry.streak)")
                    }
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundStyle(.white.opacity(0.92))

                    if !entry.lessonComplete {
                        Text(entry.expiresAt, style: .timer)
                            .font(.system(size: family == .systemSmall ? 23 : 31, weight: .black, design: .rounded))
                            .monospacedDigit()
                            .lineLimit(1)
                            .minimumScaleFactor(0.55)
                    } else {
                        Text(state.headline)
                            .font(.system(size: family == .systemSmall ? 18 : 25, weight: .black, design: .rounded))
                            .lineLimit(2)
                            .minimumScaleFactor(0.65)
                    }

                    Text(state.line)
                        .font(.system(size: family == .systemSmall ? 12 : 15, weight: .bold, design: .rounded))
                        .lineLimit(family == .systemSmall ? 3 : 2)
                        .minimumScaleFactor(0.72)

                    if family != .systemSmall {
                        Text(entry.market)
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundStyle(.white.opacity(0.72))
                    }
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(state.image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: family == .systemSmall ? 78 : 145, height: family == .systemSmall ? 115 : 155, alignment: .bottom)
                    .offset(x: family == .systemSmall ? 13 : 17, y: 13)
            }
            .padding(14)
        }
        .containerBackground(for: .widget) { Color.orange }
        .widgetURL(URL(string: "marketlingo://"))
    }
}

struct LeoWidget: Widget {
    let kind = widgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LeoProvider()) { entry in
            LeoWidgetView(entry: entry)
        }
        .configurationDisplayName("Leo Streak")
        .description("Leo keeps your market fluency and streak honest.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

@main
struct LeoWidgetBundle: WidgetBundle {
    var body: some Widget {
        LeoWidget()
    }
}