FactoryBot.define do
  factory :employee do
    sequence(:full_name) { |n| "Test Person #{n}" }
    sequence(:email) { |n| "person#{n}@acme.example" }
    gender { "F" }
    department { "Engineering" }
    job_title { "Software Engineer" }
    level { 3 }
    country { "US" }
    salary { 100_000 }
    hire_date { Date.new(2022, 1, 1) }
  end
end
