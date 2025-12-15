import tkinter as tk
from tkinter import ttk, messagebox
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
from dotenv import load_dotenv

class ProductManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Supply Management Dashboard - Admin")
        self.root.geometry("1200x700")
        
        load_dotenv()
        
        service_account_path = os.getenv('ADMIN_PACKAGE')
        
        if not service_account_path:
            messagebox.showerror("Configuration Error", "ADMIN_PACKAGE environment variable not set in .env file")
            root.destroy()
            return
        
        if not service_account_path.endswith('.json'):
            service_account_path = service_account_path + '.json'
        
        # Initialize Firebase Admin SDK
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            
        except FileNotFoundError:
            messagebox.showerror("File Not Found", f"Service account key file not found:\n{service_account_path}\n\nMake sure the file exists and the path in .env is correct.")
            root.destroy()
            return
        except Exception as e:
            messagebox.showerror("Firebase Error", f"Failed to initialize Firebase:\n{str(e)}")
            root.destroy()
            return
        
        self.categories = []
        self.products = []
        self.selected_product = None
        
        self.bg_color = "#f8f9fa"
        self.primary_color = "#8e44ad"
        self.success_color = "#27ae60"
        self.danger_color = "#e74c3c"
        
        self.setup_ui()
        self.load_categories()
        self.load_products()
        
    def setup_ui(self):
        main_frame = tk.Frame(self.root, bg=self.bg_color)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        title_label = tk.Label(
            main_frame, 
            text="Product Management Dashboard - Admin",
            font=("Arial", 20, "bold"),
            bg=self.bg_color,
            fg=self.primary_color
        )
        title_label.pack(pady=10)
        
        tab_control = ttk.Notebook(main_frame)
        
        products_tab = tk.Frame(tab_control, bg=self.bg_color)
        tab_control.add(products_tab, text="Products")
        
        categories_tab = tk.Frame(tab_control, bg=self.bg_color)
        tab_control.add(categories_tab, text="Categories")
        
        tab_control.pack(fill=tk.BOTH, expand=True)
        
        content_frame = tk.Frame(products_tab, bg=self.bg_color)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.setup_categories_view(categories_tab)
        self.setup_left_panel(content_frame) 
        self.setup_right_panel(content_frame)
        
    def setup_left_panel(self, parent):
        left_frame = tk.Frame(parent, bg=self.bg_color, width=600)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        filter_frame = tk.Frame(left_frame, bg=self.bg_color)
        filter_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(filter_frame, text="Search:", bg=self.bg_color, font=("Arial", 10)).pack(side=tk.LEFT, padx=5)
        self.search_var = tk.StringVar()
        self.search_var.trace('w', lambda *args: self.filter_products())
        tk.Entry(filter_frame, textvariable=self.search_var, width=30).pack(side=tk.LEFT, padx=5)
        
        tk.Label(filter_frame, text="Category:", bg=self.bg_color, font=("Arial", 10)).pack(side=tk.LEFT, padx=5)
        self.category_filter_var = tk.StringVar(value="All")
        self.category_filter = ttk.Combobox(filter_frame, textvariable=self.category_filter_var, state="readonly", width=20)
        self.category_filter.pack(side=tk.LEFT, padx=5)
        self.category_filter.bind('<<ComboboxSelected>>', lambda e: self.filter_products())
        
        table_frame = tk.Frame(left_frame, bg=self.bg_color)
        table_frame.pack(fill=tk.BOTH, expand=True)
        
        y_scrollbar = ttk.Scrollbar(table_frame)
        y_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        x_scrollbar = ttk.Scrollbar(table_frame, orient=tk.HORIZONTAL)
        x_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
        columns = ("ID", "Name", "Price", "Category", "Stock", "Status")
        self.tree = ttk.Treeview(
            table_frame,
            columns=columns,
            show="headings",
            yscrollcommand=y_scrollbar.set,
            xscrollcommand=x_scrollbar.set
        )
        
        self.tree.column("ID", width=150, anchor=tk.W)
        self.tree.column("Name", width=200, anchor=tk.W)
        self.tree.column("Price", width=80, anchor=tk.E)
        self.tree.column("Category", width=120, anchor=tk.W)
        self.tree.column("Stock", width=60, anchor=tk.CENTER)
        self.tree.column("Status", width=80, anchor=tk.CENTER)
        
        for col in columns:
            self.tree.heading(col, text=col, anchor=tk.W if col != "Price" else tk.E)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        y_scrollbar.config(command=self.tree.yview)
        x_scrollbar.config(command=self.tree.xview)
        
        self.tree.bind('<<TreeviewSelect>>', self.on_product_select)
        
        btn_frame = tk.Frame(left_frame, bg=self.bg_color)
        btn_frame.pack(fill=tk.X, pady=10)
        
        tk.Button(btn_frame, text="New Product", command=self.new_product, bg=self.success_color, fg="white", font=("Arial", 10, "bold"), cursor="hand2", width=15).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Selected", command=self.delete_product, bg=self.danger_color, fg="white", font=("Arial", 10, "bold"), cursor="hand2", width=15).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.load_products, bg=self.primary_color, fg="white", font=("Arial", 9), cursor="hand2").pack(side=tk.LEFT, padx=5)

        
    def setup_right_panel(self, parent):
        right_frame = tk.Frame(parent, bg="white", relief=tk.RIDGE, bd=2)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(10, 0))
        
        self.form_title = tk.Label(
            right_frame,
            text="Product Details",
            font=("Arial", 16, "bold"),
            bg="white",
            fg=self.primary_color
        )
        self.form_title.pack(pady=15)
        
        # Scrollable form container
        canvas = tk.Canvas(right_frame, bg="white")
        scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg="white")
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        form_frame = tk.Frame(scrollable_frame, bg="white", padx=20)
        form_frame.pack(fill=tk.BOTH, expand=True)
        
        self.product_id = None
        
        self.create_form_field(form_frame, "Product Name:", "name_var")
        
        tk.Label(form_frame, text="Description:", bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        self.desc_text = tk.Text(form_frame, height=4, width=40, font=("Arial", 10))
        self.desc_text.pack(fill=tk.X, pady=(0, 10))
        
        self.create_form_field(form_frame, "Price:", "price_var")
        
        tk.Label(form_frame, text="Category:", bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(form_frame, textvariable=self.category_var, state="readonly", width=37)
        self.category_combo.pack(fill=tk.X, pady=(0, 10))
        
        self.create_form_field(form_frame, "Icon URL:", "icon_var")
        self.create_form_field(form_frame, "Stock Quantity:", "stock_var")
        
        # Input validation for stock quantity (numbers only)
        def validate_stock(P):
            if P == "": return True
            try: int(P); return True
            except ValueError: return False
        
        vcmd = (self.root.register(validate_stock), '%P')
        stock_entry = form_frame.winfo_children()[-1] 
        stock_entry.config(validate='key', validatecommand=vcmd)
        
        self.instock_var = tk.BooleanVar(value=True)
        tk.Checkbutton(form_frame, text="In Stock", variable=self.instock_var, bg="white", font=("Arial", 10)).pack(anchor=tk.W, pady=10)
        
        self.create_form_field(form_frame, "Tags (comma-separated):", "tags_var")
        
        tk.Button(form_frame, text="Save Product", command=self.save_product, bg=self.success_color, fg="white", font=("Arial", 12, "bold"), cursor="hand2", height=2).pack(fill=tk.X, pady=20)
        tk.Button(form_frame, text="Clear Form", command=self.clear_form, bg="#6c757d", fg="white", font=("Arial", 10), cursor="hand2").pack(fill=tk.X)
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
    def create_form_field(self, parent, label_text, var_name):
        tk.Label(parent, text=label_text, bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        var = tk.StringVar()
        setattr(self, var_name, var)
        tk.Entry(parent, textvariable=var, font=("Arial", 10), width=40).pack(fill=tk.X, pady=(0, 10))
        
    def load_categories(self):
        try:
            categories_ref = self.db.collection('Supply Categories')
            docs = categories_ref.stream()
            
            self.categories = []
            for doc in docs:
                cat_data = doc.to_dict()
                cat_data['id'] = doc.id
                self.categories.append(cat_data)
            
            self.categories.sort(key=lambda x: x.get('name', ''))
            
            category_names = ["All"] + [cat.get('name', 'Unknown') for cat in self.categories]
            self.category_filter['values'] = category_names
            
            # Form dropdown values
            category_names_form = [cat.get('name', 'Unknown') for cat in self.categories]
            self.category_combo['values'] = category_names_form
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load categories:\n{str(e)}")
            
    def load_products(self):
        try:
            supplies_ref = self.db.collection('Supplies')
            docs = supplies_ref.stream()
            
            self.products = []
            for doc in docs:
                product_data = doc.to_dict()
                product_data['id'] = doc.id
                self.products.append(product_data)
            
            self.products.sort(key=lambda x: x.get('name', '').lower())
            
            self.display_products(self.products)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load products:\n{str(e)}")
            self.products = []
            
    def display_products(self, products):
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        for product in products:
            category_name = self.get_category_name(product.get('categoryId', ''))
            stock_qty = product.get('stockQuantity', 0)
            in_stock = "Yes" if product.get('inStock', True) else "No"
            
            self.tree.insert('', tk.END, values=(
                product.get('id', 'N/A'),
                product.get('name', 'Unknown'),
                f"{product.get('price', 0):.2f}",
                category_name,
                stock_qty,
                in_stock
            ))
            
    def filter_products(self):
        search_term = self.search_var.get().lower()
        category_filter = self.category_filter_var.get()
        
        filtered = self.products
        
        if category_filter != "All":
            category_id = self.get_category_id(category_filter)
            if category_id:
                filtered = [p for p in filtered if p.get('categoryId') == category_id]
        
        if search_term:
            filtered = [
                p for p in filtered
                if search_term in p.get('name', '').lower() or
                   search_term in p.get('description', '').lower()
            ]
        
        self.display_products(filtered)
        
    def on_product_select(self, event):
        selection = self.tree.selection()
        if not selection: return
        
        item = self.tree.item(selection[0])
        product_id = item['values'][0]
        
        product = next((p for p in self.products if p.get('id') == product_id), None)
        if product:
            self.populate_form(product)
            
    def populate_form(self, product):
        self.product_id = product.get('id')
        self.form_title.config(text=f"Edit: {product.get('name', 'Product')}")
        
        self.name_var.set(product.get('name', ''))
        self.desc_text.delete('1.0', tk.END)
        self.desc_text.insert('1.0', product.get('description', ''))
        self.price_var.set(product.get('price', 0))
        
        category_name = self.get_category_name(product.get('categoryId', ''))
        self.category_var.set(category_name)
        
        self.icon_var.set(product.get('icon', ''))
        self.stock_var.set(product.get('stockQuantity', 0))
        self.instock_var.set(product.get('inStock', True))
        
        tags = ', '.join(product.get('tags', []))
        self.tags_var.set(tags)
        
    def new_product(self):
        self.clear_form()
        self.form_title.config(text="New Product")
        
    def clear_form(self):
        self.product_id = None
        self.form_title.config(text="Product Details")
        self.name_var.set('')
        self.desc_text.delete('1.0', tk.END)
        self.price_var.set('')
        self.category_var.set('')
        self.icon_var.set('')
        self.stock_var.set('')
        self.instock_var.set(True)
        self.tags_var.set('')
        
    def save_product(self):
        # Validation checks
        if not self.name_var.get().strip():
            messagebox.showwarning("Validation", "Product name is required")
            return
        
        try:
            price = float(self.price_var.get() or 0)
            if price < 0: raise ValueError
        except ValueError:
            messagebox.showwarning("Validation", "Invalid price value")
            return
        
        try:
            stock = int(self.stock_var.get() or 0)
            if stock < 0: raise ValueError
        except ValueError:
            messagebox.showwarning("Validation", "Invalid stock quantity")
            return
        
        category_id = self.get_category_id(self.category_var.get())
        
        tags_str = self.tags_var.get().strip()
        tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        
        product_data = {
            'name': self.name_var.get().strip(),
            'description': self.desc_text.get('1.0', tk.END).strip(),
            'price': price,
            'categoryId': category_id or '',
            'icon': self.icon_var.get().strip(),
            'stockQuantity': stock,
            'inStock': self.instock_var.get(),
            'tags': tags,
            'updatedAt': datetime.now().isoformat()
        }
        
        try:
            if self.product_id:
                # Update existing product
                self.db.collection('Supplies').document(self.product_id).update(product_data)
                messagebox.showinfo("Success", "Product updated successfully")
            else:
                # Create new product
                product_data['createdAt'] = datetime.now().isoformat()
                self.db.collection('Supplies').add(product_data)
                messagebox.showinfo("Success", "Product created successfully")
            
            self.load_products()
            self.clear_form()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save product:\n{str(e)}")
            
    def delete_product(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Selection", "Please select a product to delete")
            return
        
        item = self.tree.item(selection[0])
        product_id = item['values'][0]
        product_name = item['values'][1]
        
        if messagebox.askyesno("Confirm Delete", f"Delete product '{product_name}'?\n\nThis action cannot be undone."):
            try:
                self.db.collection('Supplies').document(product_id).delete()
                messagebox.showinfo("Success", "Product deleted successfully")
                self.load_products()
                self.clear_form()
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete product:\n{str(e)}")
                
    def get_category_name(self, category_id):
        category = next((c for c in self.categories if c.get('id') == category_id), None)
        return category.get('name', 'Unknown') if category else 'Unknown'
    
    def get_category_id(self, category_name):
        category = next((c for c in self.categories if c.get('name') == category_name), None)
        return category.get('id', '') if category else ''
    
    # Category Management Tab Logic
    
    def setup_categories_view(self, parent):
        main_frame = tk.Frame(parent, bg=self.bg_color)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        left_frame = tk.Frame(main_frame, bg=self.bg_color)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        tk.Label(left_frame, text="Categories", font=("Arial", 16, "bold"), bg=self.bg_color, fg=self.primary_color).pack(pady=10)
        
        table_frame = tk.Frame(left_frame, bg=self.bg_color)
        table_frame.pack(fill=tk.BOTH, expand=True)
        
        y_scroll = ttk.Scrollbar(table_frame)
        y_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        columns = ("ID", "Name", "Description", "Items", "Active")
        self.category_tree = ttk.Treeview(table_frame, columns=columns, show="headings", yscrollcommand=y_scroll.set)
        
        self.category_tree.column("ID", width=150)
        self.category_tree.column("Name", width=150)
        self.category_tree.column("Description", width=200)
        self.category_tree.column("Items", width=60)
        self.category_tree.column("Active", width=60)
        
        for col in columns:
            self.category_tree.heading(col, text=col)
        
        self.category_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        y_scroll.config(command=self.category_tree.yview)
        
        self.category_tree.bind('<<TreeviewSelect>>', self.on_category_select)
        
        btn_frame = tk.Frame(left_frame, bg=self.bg_color)
        btn_frame.pack(fill=tk.X, pady=10)
        
        tk.Button(btn_frame, text="New Category", command=self.new_category, bg=self.success_color, fg="white", font=("Arial", 10, "bold"), cursor="hand2", width=15).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Selected", command=self.delete_category, bg=self.danger_color, fg="white", font=("Arial", 10, "bold"), cursor="hand2", width=15).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_categories, bg=self.primary_color, fg="white", font=("Arial", 10, "bold"), cursor="hand2", width=15).pack(side=tk.LEFT, padx=5)
        
        right_frame = tk.Frame(main_frame, bg="white", relief=tk.RIDGE, bd=2)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH)
        
        self.category_form_title = tk.Label(
            right_frame,
            text="Category Details",
            font=("Arial", 16, "bold"),
            bg="white",
            fg=self.primary_color
        )
        self.category_form_title.pack(pady=15)
        
        form_frame = tk.Frame(right_frame, bg="white", padx=20, pady=10)
        form_frame.pack(fill=tk.BOTH, expand=True)
        
        self.category_id = None
        
        tk.Label(form_frame, text="Category Name:", bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        self.cat_name_var = tk.StringVar()
        tk.Entry(form_frame, textvariable=self.cat_name_var, font=("Arial", 10), width=40).pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(form_frame, text="Description:", bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        self.cat_desc_text = tk.Text(form_frame, height=4, width=40, font=("Arial", 10))
        self.cat_desc_text.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(form_frame, text="Icon URL:", bg="white", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(10, 5))
        self.cat_icon_var = tk.StringVar()
        tk.Entry(form_frame, textvariable=self.cat_icon_var, font=("Arial", 10), width=40).pack(fill=tk.X, pady=(0, 10))
        
        self.cat_active_var = tk.BooleanVar(value=True)
        tk.Checkbutton(form_frame, text="Active", variable=self.cat_active_var, bg="white", font=("Arial", 10)).pack(anchor=tk.W, pady=10)
        
        tk.Button(form_frame, text="Save Category", command=self.save_category, bg=self.success_color, fg="white", font=("Arial", 12, "bold"), cursor="hand2", height=2).pack(fill=tk.X, pady=20)
        
        tk.Button(form_frame, text="Clear Form", command=self.clear_category_form, bg="#6c757d", fg="white", font=("Arial", 10), cursor="hand2").pack(fill=tk.X)
    
    def refresh_categories(self):
        self.load_categories()
        self.display_categories()
    
    def display_categories(self):
        for item in self.category_tree.get_children():
            self.category_tree.delete(item)
        
        for cat in self.categories:
            self.category_tree.insert('', tk.END, values=(
                cat.get('id', 'N/A'),
                cat.get('name', 'Unknown'),
                cat.get('description', '')[:50],
                cat.get('itemCount', 0),
                "Yes" if cat.get('isActive', True) else "No"
            ))
    
    def on_category_select(self, event):
        selection = self.category_tree.selection()
        if not selection: return
        
        item = self.category_tree.item(selection[0])
        category_id = item['values'][0]
        
        category = next((c for c in self.categories if c.get('id') == category_id), None)
        if category:
            self.populate_category_form(category)
    
    def populate_category_form(self, category):
        self.category_id = category.get('id')
        self.category_form_title.config(text=f"Edit: {category.get('name', 'Category')}")
        
        self.cat_name_var.set(category.get('name', ''))
        self.cat_desc_text.delete('1.0', tk.END)
        self.cat_desc_text.insert('1.0', category.get('description', ''))
        self.cat_icon_var.set(category.get('icon', ''))
        self.cat_active_var.set(category.get('isActive', True))
    
    def new_category(self):
        self.clear_category_form()
        self.category_form_title.config(text="New Category")
    
    def clear_category_form(self):
        self.category_id = None
        self.category_form_title.config(text="Category Details")
        self.cat_name_var.set('')
        self.cat_desc_text.delete('1.0', tk.END)
        self.cat_icon_var.set('')
        self.cat_active_var.set(True)
    
    def save_category(self):
        if not self.cat_name_var.get().strip():
            messagebox.showwarning("Validation", "Category name is required")
            return
        
        category_data = {
            'name': self.cat_name_var.get().strip(),
            'description': self.cat_desc_text.get('1.0', tk.END).strip(),
            'icon': self.cat_icon_var.get().strip(),
            'isActive': self.cat_active_var.get(),
            'updatedAt': datetime.now().isoformat()
        }
        
        try:
            if self.category_id:
                # Update existing
                self.db.collection('Supply Categories').document(self.category_id).update(category_data)
                messagebox.showinfo("Success", "Category updated successfully")
            else:
                # Create new
                category_data['createdAt'] = datetime.now().isoformat()
                category_data['itemCount'] = 0
                self.db.collection('Supply Categories').add(category_data)
                messagebox.showinfo("Success", "Category created successfully")
            
            self.refresh_categories()
            self.clear_category_form()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save category:\n{str(e)}")
    
    def delete_category(self):
        selection = self.category_tree.selection()
        if not selection:
            messagebox.showwarning("Selection", "Please select a category to delete")
            return
        
        item = self.category_tree.item(selection[0])
        category_id = item['values'][0]
        category_name = item['values'][1]
        item_count = item['values'][3]
        
        if item_count > 0:
            if not messagebox.askyesno("Warning", f"Category '{category_name}' has {item_count} products.\n\nDelete anyway?"):
                return
        
        if messagebox.askyesno("Confirm Delete", f"Delete category '{category_name}'?\n\nThis action cannot be undone."):
            try:
                self.db.collection('Supply Categories').document(category_id).delete()
                messagebox.showinfo("Success", "Category deleted successfully")
                self.refresh_categories()
                self.clear_category_form()
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete category:\n{str(e)}")


if __name__ == "__main__":
    root = tk.Tk()
    app = ProductManager(root)
    root.mainloop()