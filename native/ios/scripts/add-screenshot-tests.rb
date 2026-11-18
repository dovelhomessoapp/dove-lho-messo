require 'xcodeproj'
project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' }
target = project.new_target(:ui_test_bundle, 'StoreScreenshots', :ios, '15.0')
target.add_dependency(app)
group = project.main_group.new_group('StoreScreenshots', 'StoreScreenshots')
file = group.new_file('StoreScreenshots.swift')
target.source_build_phase.add_file_reference(file)
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'it.dovelhomesso.casadolcecasa.screenshots'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['TEST_TARGET_NAME'] = 'App'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.set_launch_target(app)
scheme.save_as(project_path, 'StoreScreenshots', true)
