import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, scrolledtext
import random, string
from typing import List, Dict, Optional
from PIL import Image, ImageTk
import io
import requests
from urllib.request import urlopen

import firebase_admin
from firebase_admin import credentials, firestore

# Firebase configuration path
SERVICE_ACCOUNT_PATH = "./servicebazaar-xxxxx-firebase-adminsdk-fbsvc-xxxxxxxxxx.json"  # TODO: set this
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

COLL_APPS       = "Provider Application"
COLL_USERS      = "User Data"
COLL_PROVIDERS  = "Provider Info"
COLL_SERVICES   = "Service Info"

DEFAULT_IMAGE_URL   = "https://icons.veryicon.com/png/o/miscellaneous/administration/account-25.png"
DEFAULT_SERVICE_IMG = "https://static.vecteezy.com/system/resources/thumbnails/012/764/959/small_2x/an-icon-design-of-service-vector.jpg"

def generate_service_id() -> str:
    """Generate a unique 6-char [A-Z0-9] ID inside Service Info"""
    while True:
        sid = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.collection(COLL_SERVICES).document(sid).get().exists:
            return sid


def fetch_services() -> List[Dict[str, str]]:
    docs = db.collection(COLL_SERVICES).stream()
    services = []
    for d in docs:
        data = d.to_dict()
        services.append({"id": d.id, "title": data.get("title", "")})
    return services


def fetch_pending_applications():
    docs = db.collection(COLL_APPS).where("state", "==", "pending").stream()
    return [(d.id, d.to_dict()) for d in docs]


def create_provider_record(payload: dict) -> str:
    ref = db.collection(COLL_PROVIDERS).document()
    ref.set(payload)
    return ref.id


def update_user_with_provider(user_id: str, provider_id: str):
    db.collection(COLL_USERS).document(user_id).update({
        "providerIds": firestore.ArrayUnion([provider_id]),
        "isProvider": True,
    })


def add_provider_to_service(service_id: str, provider_id: str):
    db.collection(COLL_SERVICES).document(service_id).update({
        "publicEmployeeIds": firestore.ArrayUnion([provider_id])
    })


def load_image_from_url(url, size=(120, 120)):
    """Load image from URL and resize it"""
    try:
        if url.startswith('http'):
            response = urlopen(url)
            image_data = response.read()
        else:
            with open(url, 'rb') as f:
                image_data = f.read()
        
        image = Image.open(io.BytesIO(image_data))
        image = image.resize(size, Image.Resampling.LANCZOS)
        return ImageTk.PhotoImage(image)
    except Exception as e:
        print(f"Error loading image: {e}")
        error_image = Image.new('RGB', size, color='red')
        text = Image.new('RGB', size, color='red')
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(text)
        try:
            font = ImageFont.load_default()
            draw.text((10, 10), "Image\nError", fill='white', font=font)
        except:
            draw.text((10, 10), "Image\nError", fill='white')
        return ImageTk.PhotoImage(text)

class ReviewApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Provider Applications Review")
        self.geometry("1300x750")

        self.services: List[Dict[str, str]] = []
        self.current_image = None

        left = ttk.Frame(self, padding=6)
        left.pack(side=tk.LEFT, fill=tk.Y)
        ttk.Label(left, text="Pending Applications", font=("Arial", 14, "bold")).pack()
        self.tree = ttk.Treeview(left, columns=("name", "phone", "service"), show="headings", height=27)
        self.tree.pack(expand=True, fill=tk.BOTH)
        self.tree.heading("name",   text="Name")
        self.tree.heading("phone", text="Phone")
        self.tree.heading("service", text="Service")
        self.tree.column("name", width=150)
        self.tree.column("phone", width=120)
        self.tree.column("service", width=150)
        self.tree.bind("<<TreeviewSelect>>", self.on_select)

        right = ttk.Frame(self, padding=10)
        right.pack(side=tk.RIGHT, expand=True, fill=tk.BOTH)
        
        top_section = ttk.Frame(right)
        top_section.pack(fill=tk.X, pady=(0, 10))
        
        self.image_frame = ttk.Frame(top_section)
        self.image_frame.pack(side=tk.LEFT, padx=(0, 20))
        ttk.Label(self.image_frame, text="Profile Image", font=("Arial", 12, "bold")).pack()
        self.image_label = ttk.Label(self.image_frame)
        self.image_label.pack()
        
        info_frame = ttk.Frame(top_section)
        info_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        ttk.Label(info_frame, text="Application Details", font=("Arial", 14, "bold")).pack(anchor=tk.W)
        self.details_txt = scrolledtext.ScrolledText(info_frame, width=60, height=10, state=tk.DISABLED)
        self.details_txt.pack(expand=True, fill=tk.BOTH, pady=5)
        
        srv_row = ttk.Frame(right)
        srv_row.pack(anchor=tk.W, pady=(0, 8))
        ttk.Label(srv_row, text="Select Service:").pack(side=tk.LEFT)
        self.service_var = tk.StringVar(value="")
        self.service_combo = ttk.Combobox(srv_row, textvariable=self.service_var, state="readonly", width=40)
        self.service_combo.pack(side=tk.LEFT, padx=6)
        ttk.Button(srv_row, text="Add Service", command=self.add_service_dialog).pack(side=tk.LEFT)
        
        btn_row = ttk.Frame(right)
        btn_row.pack(pady=4)
        self.accept_btn = ttk.Button(btn_row, text="Accept", command=self.accept_application, state=tk.DISABLED)
        self.accept_btn.grid(row=0, column=0, padx=5)
        self.reject_btn = ttk.Button(btn_row, text="Reject", command=self.reject_application, state=tk.DISABLED)
        self.reject_btn.grid(row=0, column=1, padx=5)
        
        self.reload_services()
        self.applications = []
        self.selected_index: Optional[int] = None
        self.refresh_list()
        
    def reload_services(self):
        self.services = fetch_services()
        self.service_combo["values"] = [s["title"] for s in self.services]
        self.service_var.set("")

    def add_service_dialog(self):
        title = simpledialog.askstring("New Service", "Service title:")
        if not title:
            return
        if any(s["title"].lower() == title.lower() for s in self.services):
            messagebox.showerror("Duplicate", "Service already exists.")
            return
        desc = simpledialog.askstring("Description", "Short description:") or ""
        img  = simpledialog.askstring("Image URL", "Image URL (optional):") or DEFAULT_SERVICE_IMG
        sid = generate_service_id()
        try:
            db.collection(COLL_SERVICES).document(sid).set({
                "title": title,
                "description": desc,
                "image": img,
                "publicEmployeeIds": [],
            })
            messagebox.showinfo("Added", f"'{title}' created with ID {sid}.")
            self.reload_services()
        except Exception as e:
            messagebox.showerror("Error", f"Could not create service: {e}")

    def refresh_list(self):
        self.tree.delete(*self.tree.get_children())
        self.applications = fetch_pending_applications()
        for idx, (_, data) in enumerate(self.applications):
            service = data.get("service", "Not specified")
            phone = data.get("phone", "No phone")
            self.tree.insert("", tk.END, iid=str(idx), values=(
                data.get("fullName", "-"),
                phone,
                service
            ))
        self.clear_details()

    def clear_details(self):
        self.details_txt.config(state=tk.NORMAL)
        self.details_txt.delete("1.0", tk.END)
        self.details_txt.config(state=tk.DISABLED)
        self.accept_btn.config(state=tk.DISABLED)
        self.reject_btn.config(state=tk.DISABLED)
        self.service_var.set("")
        self.selected_index = None
        self.image_label.config(image='')
        self.current_image = None

    def on_select(self, _):
        sel = self.tree.selection()
        if not sel:
            return
        self.selected_index = int(sel[0])
        _, data = self.applications[self.selected_index]
        self.details_txt.config(state=tk.NORMAL)
        self.details_txt.delete("1.0", tk.END)
        
        exclude_fields = {"createdAt", "state", "userId", "image"}
        
        for k, v in data.items():
            if k in exclude_fields:
                continue
                
            if k == "locationName" and v:
                self.details_txt.insert(tk.END, f"Verified Location: {v}\n\n")
            elif k in ["lat", "lng"] and v:
                continue
            elif k == "location" and isinstance(v, dict):
                # Handle location object if it exists
                lat = v.get("lat", "N/A")
                lng = v.get("lng", "N/A")
                self.details_txt.insert(tk.END, f"Coordinates: {lat}, {lng}\n")
            else:
                self.details_txt.insert(tk.END, f"{k}: {v}\n")
        
        image_url = data.get("image", DEFAULT_IMAGE_URL)
        self.current_image = load_image_from_url(image_url)
        self.image_label.config(image=self.current_image)
                
        self.details_txt.config(state=tk.DISABLED)
        self.accept_btn.config(state=tk.NORMAL)
        self.reject_btn.config(state=tk.NORMAL)

    def accept_application(self):
        if self.selected_index is None:
            return

        # 1. Check if service is picked
        service_title = self.service_var.get()
        if not service_title:
            messagebox.showwarning("Choose Service",
                                   "Select (or add) a service before accepting.")
            return
        service_obj = next((s for s in self.services
                             if s["title"] == service_title), None)
        if not service_obj:
            messagebox.showerror("Error", "Service not found; reload list.")
            return
        service_id = service_obj["id"]

        # 2. Get application data
        app_id, app_data = self.applications[self.selected_index]
        user_id            = app_data.get("userId")
        if not user_id:
            messagebox.showerror("Error", "userId missing in application")
            return

        # 3. Build provider record
        provider_payload: dict = {
            "name"              : app_data.get("fullName", "Unnamed"),
            "image"             : app_data.get("image", DEFAULT_IMAGE_URL),
            "address"           : app_data.get("address", ""),
            "userId"            : user_id,
            "service"           : service_title,
            "serviceId"         : service_id,
            "rating"            : 0,
            "successfulServices": 0,
            "totalRating"       : 0,
            "createdAt"         : firestore.SERVER_TIMESTAMP,
        }

        # 3a. Include location if present - handles both old and new formats
        if "lat" in app_data and "lng" in app_data:
            provider_payload["location"] = {
                "lat": float(app_data["lat"]),
                "lng": float(app_data["lng"]),
                "name": app_data.get("locationName", "Location not specified")
            }
        elif "location" in app_data and isinstance(app_data["location"], dict):
            provider_payload["location"] = {
                "lat": float(app_data["location"].get("lat", 0)),
                "lng": float(app_data["location"].get("lng", 0)),
                "name": app_data["location"].get("name", "Location not specified")
            }

        # 4. Write everything in a consistent transaction (Create Provider, Update User, Update Service, Delete App)
        try:
            provider_id = create_provider_record(provider_payload)
            update_user_with_provider(user_id, provider_id)
            add_provider_to_service(service_id, provider_id)
            db.collection(COLL_APPS).document(app_id).delete()

            messagebox.showinfo(
                "Accepted",
                f"Provider created with id {provider_id} and added to {service_title}."
            )
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to accept: {exc}")
        finally:
            self.refresh_list()


    def reject_application(self):
        if self.selected_index is None:
            return
        app_id, data = self.applications[self.selected_index]
        user_id = data.get("userId")
        try:
            db.collection(COLL_APPS).document(app_id).delete()
            if user_id:
                db.collection(COLL_USERS).document(user_id).update({"isWorkerApplied": False})
            messagebox.showinfo("Rejected", "Application rejected.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to reject: {e}")
        finally:
            self.refresh_list()


if __name__ == "__main__":
    ReviewApp().mainloop()