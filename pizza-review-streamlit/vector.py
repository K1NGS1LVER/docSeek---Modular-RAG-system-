from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import os
import pandas as pd

DB_LOCATION = "./chroma_langchain_db"

def get_retriever():
    df = pd.read_csv("realistic_restaurant_reviews.csv")

    embeddings = OllamaEmbeddings(
        model="mxbai-embed-large",
        base_url="http://localhost:11434"
    )

    add_documents = not os.path.exists(DB_LOCATION)

    vector_store = Chroma(
        collection_name="restaurant_reviews",
        persist_directory=DB_LOCATION,
        embedding_function=embeddings
    )

    if add_documents:
        documents = []
        ids = []

        for i, row in df.iterrows():
            documents.append(
                Document(
                    page_content=row["Title"] + " " + row["Review"],
                    metadata={
                        "rating": row["Rating"],
                        "date": row["Date"]
                    }
                )
            )
            ids.append(str(i))

        vector_store.add_documents(documents=documents, ids=ids)

    return vector_store.as_retriever(search_kwargs={"k": 5})
