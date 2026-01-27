import streamlit as st
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from vector import get_retriever

st.set_page_config(
    page_title="🍕 Pizza Restaurant AI",
    page_icon="🍕",
    layout="centered"
)

st.title("🍕 Pizza Restaurant Review Assistant")
st.write("Ask questions about the restaurant based on real customer reviews.")

@st.cache_resource
def load_model():
    return ChatOllama(
        model="llama3.2",
        base_url="http://localhost:11434",
        temperature=0.1
    )

@st.cache_resource
def load_retriever():
    return get_retriever()

model = load_model()
retriever = load_retriever()

template = """
You are an expert in answering questions about a pizza restaurant.

Use ONLY the reviews below to answer the question.

Reviews:
{reviews}

Question:
{question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

question = st.text_input(
    "Ask your question:",
    placeholder="e.g. Is the pizza spicy?"
)

if st.button("Get Answer"):
    if not question.strip():
        st.warning("Please enter a question.")
    else:
        with st.spinner("Searching reviews and generating answer..."):
            docs = retriever.invoke(question)
            reviews = "\n\n".join(doc.page_content for doc in docs)

            response = chain.invoke({
                "reviews": reviews,
                "question": question
            })

        st.success("Answer")
        st.write(response.content)

        with st.expander("📄 See retrieved reviews"):
            for i, doc in enumerate(docs, 1):
                st.markdown(f"**Review {i}:**")
                st.write(doc.page_content)
