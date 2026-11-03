require 'xcodeproj'

project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
target = project.targets.find { |t| t.name == 'App' }
raise 'App target not found' unless target
group = project.main_group.find_subpath('App', false)
raise 'App source group not found' unless group
[['BlufflePremium.swift', target.source_build_phase],
 ['bluffle-premium-questions.json', target.resources_build_phase]].each do |name, phase|
  ref = group.files.find { |f| f.path == name } || group.new_file(name)
  phase.add_file_reference(ref, true) unless phase.files_references.include?(ref)
end
attributes = project.root_object.attributes['TargetAttributes'] ||= {}
app_attributes = attributes[target.uuid] ||= {}
capabilities = app_attributes['SystemCapabilities'] ||= {}
capabilities['com.apple.InAppPurchase'] = {'enabled' => 1}
project.save
