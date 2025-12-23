# CSV Import Workflow (Monitors & Phones)

This guide explains how to use the CSV importer and the provided templates to ingest real monitor and phone products into PriceLance.

---

## 1. Fill in a few real monitors

- **Open the template**
  - In your editor, open `monitors-real.csv` from the project root.

- **Fill only a few rows first (3–5 rows is enough to validate the pipeline)**
  - For each of the first 3–5 rows:
    - Manually browse to **eMAG / Altex / PC Garage** in your browser.
    - Find the corresponding product page for that row.

- **Replace placeholders in each chosen row**
  - `PASTE_URL_HERE`
    - Replace with the **real product page URL** from the store.
  - `PASTE_PRICE_HERE`
    - Replace with the **real price**, using the format: `1234.56` (dot as decimal separator, no commas).

- **Adjust delivery and stock fields**
  - `delivery_days`
    - Set to a **small integer** such as `2`, `3`, or `4` depending on what the store shows.
  - `fast_delivery`
    - Set to `true` **only if** the page clearly shows very fast shipping (e.g. next-day delivery).
    - Otherwise, leave it as `false`.
  - `in_stock`
    - Set to `true` if the product is clearly **in stock**.
    - Set to `false` if it shows out-of-stock / preorder / unavailable.

- **Do not overfill initially**
  - It is enough to fully fill out **3 rows** at first to prove the end-to-end import and search pipeline.

---

## 2. Import `monitors-real.csv`

- **Open the admin import page**
  - Navigate to: `http://localhost:3000/admin/import-csv`.

- **Upload the CSV**
  - Click **"Choose File"**.
  - Select `monitors-real.csv` from the project root.

- **Run the import**
  - Click **"Import CSV"**.

- **Check the results**
  - In the **"Import Results"** panel, verify that:
    - **Products created** is **> 0** (some new products were created).
    - **Listings created** is **> 0** (some new listings were created).
    - **Errors** is **0**, or only contains warnings/errors for rows you intentionally left blank or partially filled.

---

## 3. See the monitors in the main app

- **Open the main search page**
  - Navigate to: `http://localhost:3000/`.

- **Search for the imported products**
  - In the search bar, type a keyword like **"Dell"** or **"LG"**, depending on which monitors you filled first.
  - Click **"Search"** or press **Enter**.

- **Verify that the imported monitors appear correctly**
  - Confirm that:
    - The new **monitor listings appear** in the results.
    - The **prices match** what you entered in the CSV.
    - The **store names** match the CSV values (e.g. `eMAG`, `Altex`, `PC Garage`).
    - Clicking a listing **opens the correct store page** in a new tab (matching the `listing_url` in the CSV).

---

## 4. Repeat for phones

- **Open the phone template**
  - In your editor, open `phones-real.csv` from the project root.

- **Fill the first 3–5 phone rows**
  - For each of the first 3–5 rows:
    - Find the real product pages on **eMAG / Altex / PC Garage**.
    - Replace:
      - `PASTE_URL_HERE` with the real product URL.
      - `PASTE_PRICE_HERE` with the real price in `1234.56` format.
    - Set/adjust:
      - `delivery_days` to a small integer (e.g. `2`, `3`, or `4`).
      - `fast_delivery` to `true` only if clearly marked as fast/next-day shipping, otherwise `false`.
      - `in_stock` to `true` if available, `false` if not.

- **Import `phones-real.csv` the same way**
  - Go again to `http://localhost:3000/admin/import-csv`.
  - Choose `phones-real.csv`.
  - Click **"Import CSV"**.
  - Confirm that **Products created** and **Listings created** increase and **Errors** is 0 or only for intentionally blank rows.

- **Verify phones in the main app**
  - Open `http://localhost:3000/`.
  - In the search bar, try queries like **"iPhone"** or **"Galaxy"**.
  - Confirm that:
    - The imported **phone listings appear**.
    - Prices match the CSV values.
    - Links open the correct store pages in a new tab.

This checklist is designed so you can quickly prove the CSV → DB → search pipeline for both monitors and phones without guessing or clicking around blindly.
