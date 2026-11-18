class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :full_name, null: false
      t.string :email, null: false
      t.string :gender                        # "F", "M", "X" or empty
      t.string :department, null: false
      t.string :job_title, null: false
      t.integer :level, null: false           # 1..7
      t.string :country, null: false          # ISO code, e.g. "IN"
      t.string :currency, null: false         # set from the country
      t.bigint :salary, null: false           # yearly, whole units of the local currency
      t.bigint :salary_usd, null: false       # same salary in USD (for comparing countries)
      t.date :hire_date, null: false
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :employees, :email, unique: true
    add_index :employees, :country
    add_index :employees, :department
    add_index :employees, :level
    add_index :employees, :status
    add_index :employees, :salary_usd
    add_index :employees, :full_name
  end
end
