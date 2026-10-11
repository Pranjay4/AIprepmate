// Seeded practice dataset for SQL questions. Queries are executed in the browser
// by AlaSQL (public/vendor/alasql.min.js) against a fresh copy of these tables.

export interface SqlTable {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
}

export const SQL_TABLES: SqlTable[] = [
  {
    name: "customers",
    columns: ["customer_id", "name", "city", "segment"],
    rows: [
      [1, "Asha Rao", "Mumbai", "Retail"],
      [2, "Vikram Shah", "Delhi", "Corporate"],
      [3, "Neha Iyer", "Bengaluru", "Retail"],
      [4, "Rohan Das", "Mumbai", "Corporate"],
      [5, "Sara Khan", "Pune", "Retail"],
      [6, "Kabir Mehta", "Delhi", "Retail"],
    ],
  },
  {
    name: "orders",
    columns: ["order_id", "customer_id", "order_date", "amount", "status"],
    rows: [
      [101, 1, "2025-01-05", 1200, "Delivered"],
      [102, 2, "2025-01-07", 5400, "Delivered"],
      [103, 1, "2025-01-15", 800, "Cancelled"],
      [104, 3, "2025-02-02", 2300, "Delivered"],
      [105, 4, "2025-02-10", 7600, "Delivered"],
      [106, 2, "2025-02-18", 3100, "Returned"],
      [107, 5, "2025-03-01", 950, "Delivered"],
      [108, 3, "2025-03-09", 1750, "Delivered"],
      [109, 4, "2025-03-12", 4200, "Cancelled"],
      [110, 1, "2025-03-20", 2600, "Delivered"],
    ],
  },
  {
    name: "employees",
    columns: ["emp_id", "name", "department", "salary", "manager_id"],
    rows: [
      [1, "Meera", "Analytics", 90000, null],
      [2, "Arjun", "Analytics", 65000, 1],
      [3, "Priya", "Analytics", 72000, 1],
      [4, "Dev", "Sales", 58000, 6],
      [5, "Isha", "Sales", 61000, 6],
      [6, "Karan", "Sales", 85000, null],
      [7, "Tara", "Finance", 70000, null],
    ],
  },
];
