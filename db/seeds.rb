# Creates 10,000 fake employees with their salary history.
#
#   bin/rails db:seed              (does nothing if employees already exist)
#   RESET=1 bin/rails db:seed      (deletes everything first, then seeds again)
#   COUNT=500 bin/rails db:seed    (a smaller data set)

if ENV["RESET"].present?
  SalaryChange.delete_all
  Employee.delete_all
end

if Employee.exists?
  puts "Employees already exist (#{Employee.count}). Use RESET=1 to start over."
else
  started = Time.current
  count = EmployeeSeeder.run(count: ENV.fetch("COUNT", EmployeeSeeder::DEFAULT_COUNT).to_i)
  puts "Seeded #{count} employees in #{(Time.current - started).round(1)} seconds."
end
