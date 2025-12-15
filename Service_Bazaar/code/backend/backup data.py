import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

cred=credentials.Certificate("servicebazaar-xxxxx-firebase-adminsdk-fbsvc-xxxxxxxxxx.json")
firebase_admin.initialize_app(cred)
db=firestore.client()


def serialize_data(d):
    #Convert Firestore datetime objects into JSON-friendly dicts.
    #Keeps all other fields intact.
    if isinstance(d,datetime):
        return {"__dt__": d.isoformat()}
    elif isinstance(d,dict):
        return {k: serialize_data(v) for k,v in d.items()}
    elif isinstance(d,list):
        return [serialize_data(i) for i in d]
    else:
        return d


def backup_collection(path,collection_ref):
    #Export a Firestore collection (and its subcollections) into JSON files.
    os.makedirs(path,exist_ok=True)
    docs_data={}

    for doc in collection_ref.stream():
        print(f" Backing up document: {collection_ref.id}/{doc.id}")
        data=serialize_data(doc.to_dict() or {})
        docs_data[doc.id]=data

        sub_path = os.path.join(path, doc.id)
        for subcoll in doc.reference.collections():
            print(f" Backing up subcollection: {subcoll.id}")
            backup_collection(os.path.join(sub_path, subcoll.id), subcoll)

    collection_file = os.path.join(path, "__collection__.json")
    with open(collection_file,"w",encoding="utf-8") as f:
        json.dump(docs_data,f,indent=2,ensure_ascii=False)

if __name__=="__main__":
    base_dir="firestore_backup"  # folder where backup will be saved
    os.makedirs(base_dir,exist_ok=True)

    print("Starting Firestore backup...\n")
    for col in db.collections():
        print(f"=== Backing up top-level collection: {col.id} ===")
        backup_collection(os.path.join(base_dir,col.id),col)
    print("\n Backup complete! Data saved in 'firestore_backup/'")
