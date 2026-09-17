Pod::Spec.new do |s|
  s.name           = 'LeoWidgetStorage'
  s.version        = '1.0.0'
  s.summary        = 'Reliable shared App Group storage for the Leo widget'
  s.description    = 'Writes MarketLingo streak data to the Leo widget App Group and reloads WidgetKit.'
  s.author         = 'MarketLingo'
  s.homepage       = 'https://market-verse.com'
  s.platform       = :ios, '16.4'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end