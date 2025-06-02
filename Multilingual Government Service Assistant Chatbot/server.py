import requests
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)
CORS(app)

df = pd.read_csv('docdt.csv')  

model = SentenceTransformer('all-MiniLM-L6-v2')

Indian_states = [
    'central', 'andhra-pradesh', 'assam', 'bihar', 'chandigarh', 'chhattisgarh', 'delhi', 
    'goa', 'gujarat', 'haryana', 'himachal-pradesh', 'jammu-kashmir', 'jharkhand', 'karnataka', 
    'kerala', 'madhya-pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'odisha', 
    'punjab', 'rajasthan', 'tamilnadu', 'telangana', 'tripura', 'uttar-pradesh', 'uttarakhand', 
    'west-bengal'
]

def translate_text(text):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=apiKey"
    
    headers = {
        "Content-Type": "application/json"
    }

    prompt = f"""Translate the following text to English only. Respond only with the translated text and nothing else:

    "{text}"
    """

    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        response_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No response')
        return response_text.strip()
    except requests.exceptions.RequestException as err:
        return f"Error: {err}"

def retrieve_documents(query, df, top_n=3):

    docs = []
    for i, row in df.iterrows():
        tokens = row["tokens"]
        
        if isinstance(tokens, str):
            tokens = tokens.split()  
        
        joined = " ".join(tokens)
        docs.append(joined)


    try:
        doc_embeddings = model.encode(docs, convert_to_tensor=True)
        query_embedding = model.encode(query, convert_to_tensor=True)
    except Exception as e:
        return df.iloc[0:0]  

    similarities = util.pytorch_cos_sim(query_embedding, doc_embeddings)[0]
    top_indices = similarities.argsort(descending=True)[:top_n]


    return df.iloc[[i.item() for i in top_indices]]

def summarize_text_with_gemini(text):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=apiKey"
    
    headers = {
        "Content-Type": "application/json"
    }

    prompt = f"""
You are given two pieces of text:

1. A user query
2. A scheme-related paragraph

Your task:
- Summarize the scheme paragraph **in the language of the user query**.

**Formatting Guidelines**:
- If the scheme name is clearly mentioned, start with it in **bold**.
- Each detail should be on a new line with * at the beginning.
- Break long or complex sentences into simpler bullet points.
- Include points like Eligibility, Features, Benefits, etc.
- Do not add intro or conclusion phrases.

Input:
{text}
"""








    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        summary = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No response')
        
        return summary.strip()

    except requests.exceptions.RequestException as err:
        return f"Error: {err}"


@app.route('/query', methods=['POST'])
def chat():
    data = request.get_json()

    query = data.get('query', '').strip()
    state_index = data.get('state', 0)

    if not query:
        return jsonify({'error': 'Empty query'}), 400

    if state_index >= len(Indian_states):
        return jsonify({'error': 'Invalid state index'}), 400

    state = Indian_states[state_index]

    translated_query = translate_text(query)

    if state:
        filtered_df = df[df["state"] == state]
    else:
        filtered_df = df[df["state"] == "central"]
    print("Selected state:", state)
    print("Filtered DF size:", filtered_df.shape)
    print("Filtered DF preview:", filtered_df.head())

    top_docs = retrieve_documents(translated_query, filtered_df, top_n=3)

    combined_text = " ".join(top_docs['tokens'])

    final_summary = summarize_text_with_gemini(f"\nUser Query: {query} \nText to explain: {combined_text}")

    return jsonify({'response': final_summary})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
