class CreateSalaryChanges < ActiveRecord::Migration[8.1]
  # One row per salary change. This is the audit trail: who/what/when/why.
  def change
    create_table :salary_changes do |t|
      t.references :employee, null: false, foreign_key: true
      t.bigint :old_salary                    # empty for the very first salary
      t.bigint :new_salary, null: false
      t.string :currency, null: false
      t.date :effective_date, null: false
      t.string :reason, null: false

      t.timestamps
    end

    add_index :salary_changes, %i[employee_id effective_date]
  end
end
