from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from vector import get_retriever

model = ChatOllama(
    model="llama3.2",
    base_url="http://localhost:11434"
)

retriever = get_retriever()

template = """
You are an expert in answering questions about a pizza restaurant.

Reviews:
{reviews}

Question:
{question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

while True:
    print("\n-------------------------------")
    question = input("Ask your question (q to quit): ")
    if question.lower() == "q":
        break

    docs = retriever.invoke(question)
    reviews = "\n\n".join(doc.page_content for doc in docs)

    result = chain.invoke({
        "reviews": reviews,
        "question": question
    })

    print(result.content)
